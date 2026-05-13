import { z } from "zod";
import { prisma } from "./db";
import type { NominationWithUsers } from "../types";
import { getCurrentWeekPeriod } from "./penalties";

// ─── Zod schemas ────────────────────────────────────────────────────────────

export const createNominationSchema = z.object({
  to_user_id: z.string().uuid("Invalid user ID"),
  title: z.string().min(1, "Title is required").max(100),
  category: z.enum(["body", "mind", "soul", "work", "relationships"]),
  frequency: z.enum(["daily", "times_per_week", "weekly"]),
  frequency_count: z.number().int().min(1).max(7),
  penalty_amount: z.number().positive("Penalty must be greater than 0"),
  message: z.string().max(300).optional(),
});

export const respondNominationSchema = z.object({
  action: z.enum(["accept", "decline"]),
  chosen_reason: z.string().max(300).optional(),
});

export type CreateNominationInput = z.infer<typeof createNominationSchema>;
export type RespondNominationInput = z.infer<typeof respondNominationSchema>;

// ─── Queries ────────────────────────────────────────────────────────────────

/** All pending nominations received by this user in their group. */
export async function getNominationsForUser(
  userId: string,
  groupId: string
): Promise<NominationWithUsers[]> {
  return prisma.nomination.findMany({
    where: { to_user_id: userId, group_id: groupId, status: "pending" },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

/** All nominations sent by this user in their group. */
export async function getSentNominations(
  userId: string,
  groupId: string
): Promise<NominationWithUsers[]> {
  return prisma.nomination.findMany({
    where: { from_user_id: userId, group_id: groupId },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createNomination(
  fromUserId: string,
  groupId: string,
  data: CreateNominationInput
): Promise<NominationWithUsers> {
  // Block if nominator already sent a nomination to the same target this week
  const { periodStart, periodEnd } = getCurrentWeekPeriod();
  const existingThisWeek = await prisma.nomination.findFirst({
    where: {
      from_user_id: fromUserId,
      to_user_id: data.to_user_id,
      created_at: { gte: periodStart, lte: periodEnd },
    },
  });
  if (existingThisWeek) {
    throw new Response(
      JSON.stringify({
        data: null,
        error: "You already nominated this person this week",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Block if target already has an active slot 2 goal
  const activeSlot2 = await prisma.goal.findFirst({
    where: {
      user_id: data.to_user_id,
      group_id: groupId,
      slot: "nominated",
      status: "active",
    },
  });
  if (activeSlot2) {
    throw new Response(
      JSON.stringify({
        data: null,
        error: "This person already has an active nominated goal",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  return prisma.nomination.create({
    data: {
      from_user_id: fromUserId,
      to_user_id: data.to_user_id,
      group_id: groupId,
      title: data.title,
      category: data.category,
      frequency: data.frequency,
      frequency_count: data.frequency_count,
      penalty_amount: data.penalty_amount,
      message: data.message ?? null,
    },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
  });
}

export async function respondToNomination(
  nominationId: string,
  userId: string,
  action: "accept" | "decline",
  chosenReason?: string
): Promise<NominationWithUsers> {
  const nomination = await prisma.nomination.findUnique({
    where: { id: nominationId },
  });

  if (!nomination) {
    throw new Response(
      JSON.stringify({ data: null, error: "Nomination not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (nomination.to_user_id !== userId) {
    throw new Response(
      JSON.stringify({ data: null, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (nomination.status !== "pending") {
    throw new Response(
      JSON.stringify({ data: null, error: "Nomination is no longer pending" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  if (action === "decline") {
    return prisma.nomination.update({
      where: { id: nominationId },
      data: { status: "declined", responded_at: new Date() },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });
  }

  // Accept: verify slot 2 is still free
  const activeSlot2 = await prisma.goal.findFirst({
    where: {
      user_id: userId,
      group_id: nomination.group_id,
      slot: "nominated",
      status: "active",
    },
  });
  if (activeSlot2) {
    throw new Response(
      JSON.stringify({ data: null, error: "Slot 2 is already occupied" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Transaction: accept this, auto-decline others, create goal
  return prisma.$transaction(async (tx) => {
    const updated = await tx.nomination.update({
      where: { id: nominationId },
      data: {
        status: "accepted",
        chosen_reason: chosenReason ?? null,
        responded_at: new Date(),
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    await tx.nomination.updateMany({
      where: {
        to_user_id: userId,
        group_id: nomination.group_id,
        status: "pending",
        id: { not: nominationId },
      },
      data: { status: "auto_declined", responded_at: new Date() },
    });

    await tx.goal.create({
      data: {
        user_id: userId,
        group_id: nomination.group_id,
        nominated_by: nomination.from_user_id,
        title: nomination.title,
        category: nomination.category,
        slot: "nominated",
        frequency: nomination.frequency,
        frequency_count: nomination.frequency_count,
        penalty_amount: nomination.penalty_amount,
      },
    });

    return updated;
  });
}
