import { z } from "zod";
import { prisma } from "./db";
import type { Checkin } from "../app/generated/prisma/client";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const createCheckinSchema = z.object({
  media_url: z.string().url("Invalid media URL"),
  caption: z.string().max(300).optional(),
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the ISO week number (1–53) for a given date. Week starts Monday. */
export function getCurrentWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Sun = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Returns all checkins for a goal, newest first. Verifies goal ownership. */
export async function getCheckinsForGoal(
  goalId: string,
  userId: string
): Promise<Checkin[]> {
  await assertGoalOwnership(goalId, userId);
  return prisma.checkin.findMany({
    where: { goal_id: goalId },
    orderBy: { created_at: "desc" },
  });
}

/** Returns checkins for a specific week. */
export async function getWeeklyCheckins(
  goalId: string,
  userId: string,
  weekNumber: number,
  year: number
): Promise<Checkin[]> {
  await assertGoalOwnership(goalId, userId);
  return prisma.checkin.findMany({
    where: { goal_id: goalId, week_number: weekNumber, year },
    orderBy: { created_at: "desc" },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createCheckin(
  goalId: string,
  userId: string,
  data: CreateCheckinInput
): Promise<Checkin> {
  await assertGoalOwnership(goalId, userId);

  const date = new Date(data.checkin_date);

  // One checkin per day per goal
  const existing = await prisma.checkin.findFirst({
    where: { goal_id: goalId, checkin_date: date },
  });
  if (existing) {
    throw new Response(
      JSON.stringify({ data: null, error: "Already checked in today for this goal" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  const weekNumber = getCurrentWeekNumber(date);
  const year = date.getFullYear();

  return prisma.checkin.create({
    data: {
      goal_id: goalId,
      user_id: userId,
      media_url: data.media_url,
      caption: data.caption ?? null,
      checkin_date: date,
      week_number: weekNumber,
      year,
    },
  });
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function assertGoalOwnership(goalId: string, userId: string) {
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
