import { z } from "zod";
import { prisma } from "./db";
import type {
  Challenge,
  ChallengeSuggestion,
  Category,
} from "../app/generated/prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SuggestionWithUser = ChallengeSuggestion & {
  fromUser: { id: string; name: string };
};

export type ChallengeWithSuggestions = Challenge & {
  suggestions: ChallengeSuggestion[];
};

export type ChallengeWithDetails = Challenge & {
  user: { id: string; name: string };
  goal: { id: string; title: string; category: Category };
  suggestions: SuggestionWithUser[];
  chosenSuggestion: SuggestionWithUser | null;
};

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const addSuggestionSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
});

export const chooseSuggestionSchema = z.object({
  suggestion_id: z.string().uuid("Invalid suggestion ID"),
});

export const completeChallengeSchema = z.object({
  proof_url: z.string().url("Invalid URL"),
  proof_caption: z.string().max(300).optional(),
});

export type AddSuggestionInput = z.infer<typeof addSuggestionSchema>;
export type ChooseSuggestionInput = z.infer<typeof chooseSuggestionSchema>;
export type CompleteChallengeInput = z.infer<typeof completeChallengeSchema>;

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
      status: { notIn: ["completed", "expired"] },
    },
    include: { suggestions: { orderBy: { created_at: "asc" } } },
    orderBy: { created_at: "desc" },
  });
}

/** Returns all non-completed challenges for a group, with full details. */
export async function getGroupChallenges(
  groupId: string
): Promise<ChallengeWithDetails[]> {
  return prisma.challenge.findMany({
    where: {
      group_id: groupId,
      status: { notIn: ["completed", "expired"] },
    },
    include: {
      user: { select: { id: true, name: true } },
      goal: { select: { id: true, title: true, category: true } },
      suggestions: {
        include: { fromUser: { select: { id: true, name: true } } },
        orderBy: { created_at: "asc" },
      },
      chosenSuggestion: {
        include: { fromUser: { select: { id: true, name: true } } },
      },
    },
    orderBy: { created_at: "desc" },
  }) as Promise<ChallengeWithDetails[]>;
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

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  return prisma.challenge.create({
    data: {
      user_id: userId,
      goal_id: goalId,
      group_id: groupId,
      status: "pending_suggestions",
      deadline,
    },
  });
}

/**
 * Adds a family member's suggestion to a challenge.
 * Auto-advances challenge from pending_suggestions → pending_choice on first suggestion.
 */
export async function addSuggestion(
  challengeId: string,
  fromUserId: string,
  description: string
): Promise<ChallengeSuggestion> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge) {
    throw new Response(
      JSON.stringify({ data: null, error: "Challenge not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (challenge.user_id === fromUserId) {
    throw new Response(
      JSON.stringify({ data: null, error: "You cannot suggest on your own challenge" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (
    challenge.status !== "pending_suggestions" &&
    challenge.status !== "pending_choice"
  ) {
    throw new Response(
      JSON.stringify({ data: null, error: "Challenge is not accepting suggestions" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const existing = await prisma.challengeSuggestion.findFirst({
    where: { challenge_id: challengeId, from_user_id: fromUserId },
  });
  if (existing) {
    throw new Response(
      JSON.stringify({
        data: null,
        error: "You already submitted a suggestion for this challenge",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.challengeSuggestion.create({
      data: {
        challenge_id: challengeId,
        from_user_id: fromUserId,
        description,
      },
    });

    // Auto-advance to pending_choice on first suggestion
    if (challenge.status === "pending_suggestions") {
      await tx.challenge.update({
        where: { id: challengeId },
        data: { status: "pending_choice" },
      });
    }

    return suggestion;
  });
}

/**
 * Owner picks a suggestion.
 * Marks it chosen, auto-declines the rest, advances to pending_proof.
 */
export async function chooseSuggestion(
  challengeId: string,
  userId: string,
  suggestionId: string
): Promise<Challenge> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { suggestions: { select: { id: true } } },
  });
  if (!challenge) {
    throw new Response(
      JSON.stringify({ data: null, error: "Challenge not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (challenge.user_id !== userId) {
    throw new Response(
      JSON.stringify({ data: null, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (challenge.status !== "pending_choice") {
    throw new Response(
      JSON.stringify({ data: null, error: "Challenge is not in the choice phase" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const belongs = challenge.suggestions.some((s) => s.id === suggestionId);
  if (!belongs) {
    throw new Response(
      JSON.stringify({ data: null, error: "Suggestion not found for this challenge" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.challengeSuggestion.update({
      where: { id: suggestionId },
      data: { status: "chosen" },
    });
    await tx.challengeSuggestion.updateMany({
      where: { challenge_id: challengeId, id: { not: suggestionId } },
      data: { status: "auto_declined" },
    });
    return tx.challenge.update({
      where: { id: challengeId },
      data: { chosen_suggestion_id: suggestionId, status: "pending_proof" },
    });
  });
}

/**
 * Owner uploads proof. Marks challenge completed and resets consecutive_misses on the goal.
 */
export async function completeChallenge(
  challengeId: string,
  userId: string,
  proofUrl: string,
  proofCaption: string | undefined
): Promise<Challenge> {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge) {
    throw new Response(
      JSON.stringify({ data: null, error: "Challenge not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (challenge.user_id !== userId) {
    throw new Response(
      JSON.stringify({ data: null, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (challenge.status !== "pending_proof") {
    throw new Response(
      JSON.stringify({ data: null, error: "Challenge is not in the proof phase" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id: challenge.goal_id },
      data: { consecutive_misses: 0 },
    });
    return tx.challenge.update({
      where: { id: challengeId },
      data: {
        proof_url: proofUrl,
        proof_caption: proofCaption ?? null,
        status: "completed",
        completed_at: new Date(),
      },
    });
  });
}
