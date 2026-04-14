import { prisma } from "./db";
import { getCurrentWeekNumber } from "./checkins";
import { createChallenge } from "./challenges";
import { createNotification } from "./notifications";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WeekPeriod {
  periodStart: Date;
  periodEnd: Date;
  weekNumber: number;
  year: number;
}

export interface PenaltySummary {
  groupId: string;
  goalsChecked: number;
  penaltiesCreated: number;
  challengesTriggered: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the Monday–Sunday period for the given date (defaults to now).
 * All times are UTC.
 */
export function getCurrentWeekPeriod(date: Date = new Date()): WeekPeriod {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const distToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + distToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    periodStart: monday,
    periodEnd: sunday,
    weekNumber: getCurrentWeekNumber(monday),
    year: monday.getUTCFullYear(),
  };
}

/** How many checkins exist for a goal in a given week. */
export async function getWeeklyCheckinCount(
  goalId: string,
  weekNumber: number,
  year: number
): Promise<number> {
  return prisma.checkin.count({
    where: { goal_id: goalId, week_number: weekNumber, year },
  });
}

/** True if a penalty was already recorded for this goal+week — prevents duplicates. */
export async function hasPenaltyThisWeek(
  goalId: string,
  weekNumber: number,
  year: number
): Promise<boolean> {
  const existing = await prisma.penalty.findFirst({
    where: { goal_id: goalId },
    select: { period_start: true },
  });
  if (!existing) return false;
  const { periodStart } = getCurrentWeekPeriod(new Date());
  return existing.period_start.getTime() === periodStart.getTime();
}

/** Returns the minimum checkin count required for a goal to pass this week. */
function requiredCount(
  frequency: string,
  frequencyCount: number
): number {
  if (frequency === "daily") return 7;
  if (frequency === "times_per_week") return frequencyCount;
  return 1; // weekly
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Runs the weekly penalty calculation for one group.
 * Called by the cron route for every group.
 */
export async function calculatePenalties(
  groupId: string
): Promise<PenaltySummary> {
  const { periodStart, periodEnd, weekNumber, year } =
    getCurrentWeekPeriod();

  const goals = await prisma.goal.findMany({
    where: { group_id: groupId, status: "active" },
  });

  let penaltiesCreated = 0;
  let challengesTriggered = 0;

  for (const goal of goals) {
    // Skip if already penalised this week (idempotency)
    const alreadyDone = await hasPenaltyThisWeek(goal.id, weekNumber, year);
    if (alreadyDone) continue;

    const checkinCount = await getWeeklyCheckinCount(
      goal.id,
      weekNumber,
      year
    );
    const required = requiredCount(goal.frequency, goal.frequency_count);
    const met = checkinCount >= required;

    if (met) {
      // Good week — reset consecutive misses
      await prisma.goal.update({
        where: { id: goal.id },
        data: { consecutive_misses: 0 },
      });
    } else {
      // Missed week — penalty + increment misses + update pot (atomic)
      const newMisses = goal.consecutive_misses + 1;

      await prisma.$transaction(async (tx) => {
        await tx.penalty.create({
          data: {
            user_id: goal.user_id,
            goal_id: goal.id,
            group_id: groupId,
            amount: goal.penalty_amount,
            period_start: periodStart,
            period_end: periodEnd,
          },
        });

        await tx.goal.update({
          where: { id: goal.id },
          data: { consecutive_misses: newMisses },
        });

        await tx.pot.update({
          where: { group_id: groupId },
          data: {
            total_amount: {
              increment: goal.penalty_amount,
            },
          },
        });
      });

      penaltiesCreated++;

      // Trigger challenge on exactly 2 consecutive misses
      if (newMisses === 2) {
        const challenge = await createChallenge(
          goal.user_id,
          goal.id,
          groupId
        );
        if (challenge) {
          challengesTriggered++;
          void createNotification(goal.user_id, "challenge_triggered", challenge.id);
        }
      }
    }
  }

  // ── Expire overdue challenges and add an extra penalty ────────────────────
  const overdueChallenge = await prisma.challenge.findMany({
    where: {
      group_id: groupId,
      status: { notIn: ["completed", "expired"] },
      deadline: { lt: new Date() },
    },
    include: { goal: { select: { penalty_amount: true } } },
  });

  for (const challenge of overdueChallenge) {
    await prisma.$transaction(async (tx) => {
      await tx.challenge.update({
        where: { id: challenge.id },
        data: { status: "expired" },
      });

      // Extra penalty for ignoring the challenge (same amount as the goal)
      await tx.penalty.create({
        data: {
          user_id: challenge.user_id,
          goal_id: challenge.goal_id,
          group_id: groupId,
          amount: challenge.goal.penalty_amount,
          period_start: periodStart,
          period_end: periodEnd,
        },
      });

      await tx.pot.update({
        where: { group_id: groupId },
        data: { total_amount: { increment: challenge.goal.penalty_amount } },
      });
    });

    penaltiesCreated++;
  }

  return {
    groupId,
    goalsChecked: goals.length,
    penaltiesCreated,
    challengesTriggered,
  };
}
