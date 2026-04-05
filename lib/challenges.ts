import { prisma } from "./db";
import type { Challenge, ChallengeSuggestion } from "../app/generated/prisma/client";

export type ChallengeWithSuggestions = Challenge & {
  suggestions: ChallengeSuggestion[];
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Returns the most recent non-completed challenge for a user in a group. */
export async function getChallengeForUser(
  userId: string,
  groupId: string
): Promise<ChallengeWithSuggestions | null> {
  return prisma.challenge.findFirst({
    where: {
      user_id: userId,
      group_id: groupId,
      status: { not: "completed" },
    },
    include: { suggestions: { orderBy: { created_at: "asc" } } },
    orderBy: { created_at: "desc" },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Creates a new challenge for a user.
 * No-ops if an active challenge already exists for the same user+goal
 * to prevent duplicates if the cron runs twice.
 */
export async function createChallenge(
  userId: string,
  goalId: string,
  groupId: string
): Promise<Challenge | null> {
  const existing = await prisma.challenge.findFirst({
    where: {
      user_id: userId,
      goal_id: goalId,
      status: { not: "completed" },
    },
  });
  if (existing) return null;

  return prisma.challenge.create({
    data: {
      user_id: userId,
      goal_id: goalId,
      group_id: groupId,
      status: "pending_suggestions",
    },
  });
}
