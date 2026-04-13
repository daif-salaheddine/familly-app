import { z } from "zod";
import { prisma } from "./db";
import type { GoalWithNominator } from "../types";

// ─── Zod schemas ────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  category: z.enum(["body", "mind", "soul", "work", "relationships"]),
  slot: z.enum(["self", "nominated"]),
  frequency: z.enum(["daily", "times_per_week", "weekly"]),
  frequency_count: z.number().int().min(1).max(7),
  penalty_amount: z.number().positive("Penalty must be greater than 0"),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  category: z.enum(["body", "mind", "soul", "work", "relationships"]).optional(),
  frequency: z.enum(["daily", "times_per_week", "weekly"]).optional(),
  frequency_count: z.number().int().min(1).max(7).optional(),
  penalty_amount: z.number().positive().optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns all goals for a user in a group, ordered newest first. */
export async function getGoals(
  userId: string,
  groupId: string
): Promise<GoalWithNominator[]> {
  return prisma.goal.findMany({
    where: { user_id: userId, group_id: groupId },
    include: { nominator: { select: { id: true, name: true } } },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Throws 409 if an active goal already occupies the given slot for this user.
 * Pass excludeGoalId when resuming a paused goal (skip checking itself).
 */
export async function validateSlotAvailable(
  userId: string,
  groupId: string,
  slot: "self" | "nominated",
  excludeGoalId?: string
): Promise<void> {
  const existing = await prisma.goal.findFirst({
    where: {
      user_id: userId,
      group_id: groupId,
      slot,
      status: "active",
      ...(excludeGoalId ? { id: { not: excludeGoalId } } : {}),
    },
  });
  if (existing) {
    const label = slot === "self" ? "Slot 1 (self)" : "Slot 2 (nominated)";
    throw new Response(
      JSON.stringify({ data: null, error: `${label} already has an active goal` }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** Throws 409 if the user already has 2 active goals in this group. */
async function validateGoalLimit(
  userId: string,
  groupId: string,
  excludeGoalId?: string
): Promise<void> {
  const count = await prisma.goal.count({
    where: {
      user_id: userId,
      group_id: groupId,
      status: "active",
      ...(excludeGoalId ? { id: { not: excludeGoalId } } : {}),
    },
  });
  if (count >= 2) {
    throw new Response(
      JSON.stringify({ data: null, error: "Maximum of 2 active goals reached" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createGoal(
  userId: string,
  groupId: string,
  data: CreateGoalInput
): Promise<GoalWithNominator> {
  await validateGoalLimit(userId, groupId);
  await validateSlotAvailable(userId, groupId, data.slot);

  return prisma.goal.create({
    data: {
      user_id: userId,
      group_id: groupId,
      title: data.title,
      category: data.category,
      slot: data.slot,
      frequency: data.frequency,
      frequency_count: data.frequency_count,
      penalty_amount: data.penalty_amount,
    },
    include: { nominator: { select: { id: true, name: true } } },
  });
}

export async function updateGoal(
  goalId: string,
  userId: string,
  data: Pick<UpdateGoalInput, "title" | "category" | "frequency" | "frequency_count" | "penalty_amount">
): Promise<GoalWithNominator> {
  await assertOwnership(goalId, userId);

  return prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.frequency_count !== undefined && { frequency_count: data.frequency_count }),
      ...(data.penalty_amount !== undefined && { penalty_amount: data.penalty_amount }),
    },
    include: { nominator: { select: { id: true, name: true } } },
  });
}

export async function pauseGoal(
  goalId: string,
  userId: string
): Promise<GoalWithNominator> {
  const goal = await assertOwnership(goalId, userId);
  if (goal.status !== "active") {
    throw new Response(
      JSON.stringify({ data: null, error: "Only active goals can be paused" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  return prisma.goal.update({
    where: { id: goalId },
    data: { status: "paused", paused_at: new Date() },
    include: { nominator: { select: { id: true, name: true } } },
  });
}

export async function resumeGoal(
  goalId: string,
  userId: string
): Promise<GoalWithNominator> {
  const goal = await assertOwnership(goalId, userId);
  if (goal.status !== "paused") {
    throw new Response(
      JSON.stringify({ data: null, error: "Only paused goals can be resumed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  await validateGoalLimit(userId, goal.group_id, goalId);
  await validateSlotAvailable(userId, goal.group_id, goal.slot, goalId);

  return prisma.goal.update({
    where: { id: goalId },
    data: { status: "active", paused_at: null },
    include: { nominator: { select: { id: true, name: true } } },
  });
}

export async function completeGoal(
  goalId: string,
  userId: string
): Promise<GoalWithNominator> {
  const goal = await assertOwnership(goalId, userId);
  if (goal.status === "completed") {
    throw new Response(
      JSON.stringify({ data: null, error: "Goal is already completed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  return prisma.goal.update({
    where: { id: goalId },
    data: { status: "completed", paused_at: null },
    include: { nominator: { select: { id: true, name: true } } },
  });
}

export async function deleteGoal(
  goalId: string,
  userId: string
): Promise<void> {
  await assertOwnership(goalId, userId);

  await prisma.$transaction(async (tx) => {
    // Delete reactions on all checkins for this goal
    const checkins = await tx.checkin.findMany({
      where: { goal_id: goalId },
      select: { id: true },
    });
    if (checkins.length > 0) {
      await tx.reaction.deleteMany({
        where: { checkin_id: { in: checkins.map((c) => c.id) } },
      });
    }
    await tx.checkin.deleteMany({ where: { goal_id: goalId } });

    // Delete challenge suggestions for challenges tied to this goal
    const challenges = await tx.challenge.findMany({
      where: { goal_id: goalId },
      select: { id: true },
    });
    if (challenges.length > 0) {
      await tx.challengeSuggestion.deleteMany({
        where: { challenge_id: { in: challenges.map((c) => c.id) } },
      });
    }
    await tx.challenge.deleteMany({ where: { goal_id: goalId } });

    await tx.penalty.deleteMany({ where: { goal_id: goalId } });

    await tx.goal.delete({ where: { id: goalId } });
  });
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function assertOwnership(goalId: string, userId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) {
    throw new Response(
      JSON.stringify({ data: null, error: "Goal not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (goal.user_id !== userId) {
    throw new Response(
      JSON.stringify({ data: null, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return goal;
}
