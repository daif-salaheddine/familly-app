import { z } from "zod";
import { prisma } from "./db";
import type { Pot, PotProposal, PotVote } from "../app/generated/prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PenaltyHistoryItem = {
  id: string;
  amount: string;
  created_at: Date;
  period_start: Date;
  user: { id: string; name: string };
  goal: { id: string; title: string };
};

export type VoteWithUser = PotVote & {
  user: { id: string; name: string };
};

export type ProposalWithVotes = PotProposal & {
  proposer: { id: string; name: string };
  votes: VoteWithUser[];
};

export type PotData = {
  pot: Pot;
  penalties: PenaltyHistoryItem[];
};

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const createProposalSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  amount: z.number().positive("Amount must be greater than 0").max(99999.99),
});

export const voteSchema = z.object({
  vote: z.enum(["for", "against"]),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type VoteInput = z.infer<typeof voteSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Throws a 404 Response if the pot doesn't exist for this group. */
async function assertPotExists(groupId: string): Promise<Pot> {
  const pot = await prisma.pot.findUnique({ where: { group_id: groupId } });
  if (!pot) {
    throw new Response(
      JSON.stringify({ data: null, error: "Pot not found for this group" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  return pot;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Returns the pot total and the last 10 penalties for the group. */
export async function getPot(groupId: string): Promise<PotData> {
  const [pot, penalties] = await Promise.all([
    assertPotExists(groupId),
    prisma.penalty.findMany({
      where: { group_id: groupId },
      include: {
        user: { select: { id: true, name: true } },
        goal: { select: { id: true, title: true } },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
  ]);

  return {
    pot,
    penalties: penalties.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      created_at: p.created_at,
      period_start: p.period_start,
      user: p.user,
      goal: p.goal,
    })),
  };
}

/**
 * Returns all proposals for a group, newest first.
 * Lazily closes any expired open proposals before returning.
 */
export async function getProposals(groupId: string): Promise<ProposalWithVotes[]> {
  const pot = await assertPotExists(groupId);
  await closeExpiredProposals(groupId);

  return prisma.potProposal.findMany({
    where: { pot_id: pot.id },
    include: {
      proposer: { select: { id: true, name: true } },
      votes: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { created_at: "desc" },
  }) as Promise<ProposalWithVotes[]>;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Creates a new reward proposal that closes 48 hours from now. */
export async function createProposal(
  groupId: string,
  userId: string,
  description: string,
  amount: number
): Promise<PotProposal> {
  const pot = await assertPotExists(groupId);

  if (amount > Number(pot.total_amount)) {
    throw new Response(
      JSON.stringify({ data: null, error: "Amount exceeds current pot balance" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const closesAt = new Date();
  closesAt.setHours(closesAt.getHours() + 48);

  return prisma.potProposal.create({
    data: {
      pot_id: pot.id,
      proposed_by: userId,
      description,
      amount,
      closes_at: closesAt,
    },
  });
}

/**
 * Toggles or switches a vote on a proposal.
 * - No prior vote → adds vote, increments counter.
 * - Same direction → removes vote (toggle off), decrements counter.
 * - Opposite direction → switches vote, adjusts both counters.
 * After every change, checks if all group members voted → auto-closes if so.
 */
export async function voteOnProposal(
  proposalId: string,
  userId: string,
  groupId: string,
  voteDirection: "for" | "against"
): Promise<ProposalWithVotes> {
  const proposal = await prisma.potProposal.findUnique({
    where: { id: proposalId },
    include: { pot: { select: { group_id: true } } },
  });

  if (!proposal) {
    throw new Response(
      JSON.stringify({ data: null, error: "Proposal not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }
  if (proposal.pot.group_id !== groupId) {
    throw new Response(
      JSON.stringify({ data: null, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (proposal.status !== "open") {
    throw new Response(
      JSON.stringify({ data: null, error: "This proposal is no longer open" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  const existingVote = await prisma.potVote.findUnique({
    where: { proposal_id_user_id: { proposal_id: proposalId, user_id: userId } },
  });

  await prisma.$transaction(async (tx) => {
    if (!existingVote) {
      // New vote
      await tx.potVote.create({
        data: { proposal_id: proposalId, user_id: userId, vote: voteDirection },
      });
      await tx.potProposal.update({
        where: { id: proposalId },
        data:
          voteDirection === "for"
            ? { votes_for: { increment: 1 } }
            : { votes_against: { increment: 1 } },
      });
    } else if (existingVote.vote === voteDirection) {
      // Same direction → toggle off
      await tx.potVote.delete({ where: { id: existingVote.id } });
      await tx.potProposal.update({
        where: { id: proposalId },
        data:
          voteDirection === "for"
            ? { votes_for: { decrement: 1 } }
            : { votes_against: { decrement: 1 } },
      });
    } else {
      // Opposite direction → switch
      await tx.potVote.update({
        where: { id: existingVote.id },
        data: { vote: voteDirection },
      });
      if (voteDirection === "for") {
        await tx.potProposal.update({
          where: { id: proposalId },
          data: { votes_for: { increment: 1 }, votes_against: { decrement: 1 } },
        });
      } else {
        await tx.potProposal.update({
          where: { id: proposalId },
          data: { votes_for: { decrement: 1 }, votes_against: { increment: 1 } },
        });
      }
    }
  });

  // Auto-close if all group members have now voted
  const [memberCount, voteCount, updatedProposal] = await Promise.all([
    prisma.groupMember.count({ where: { group_id: groupId } }),
    prisma.potVote.count({ where: { proposal_id: proposalId } }),
    prisma.potProposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: {
        proposer: { select: { id: true, name: true } },
        votes: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  if (voteCount >= memberCount && updatedProposal.status === "open") {
    const isApproved = updatedProposal.votes_for > updatedProposal.votes_against;
    await prisma.$transaction(async (tx) => {
      await tx.potProposal.update({
        where: { id: proposalId },
        data: { status: isApproved ? "approved" : "rejected" },
      });
      if (isApproved && Number(updatedProposal.amount) > 0) {
        const pot = await tx.pot.findFirst({
          where: { group_id: groupId },
          select: { id: true, total_amount: true },
        });
        if (pot) {
          await tx.pot.update({
            where: { id: pot.id },
            data: { total_amount: Math.max(0, Number(pot.total_amount) - Number(updatedProposal.amount)) },
          });
        }
      }
    });
    // Re-fetch with the closed status
    return prisma.potProposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: {
        proposer: { select: { id: true, name: true } },
        votes: { include: { user: { select: { id: true, name: true } } } },
      },
    }) as Promise<ProposalWithVotes>;
  }

  return updatedProposal as ProposalWithVotes;
}

/**
 * Marks expired open proposals as approved or rejected.
 * Called lazily on every getProposals() call.
 */
export async function closeExpiredProposals(groupId: string): Promise<void> {
  const pot = await prisma.pot.findUnique({ where: { group_id: groupId } });
  if (!pot) return;

  const expired = await prisma.potProposal.findMany({
    where: {
      pot_id: pot.id,
      status: "open",
      closes_at: { lt: new Date() },
    },
  });

  for (const p of expired) {
    const isApproved = p.votes_for > p.votes_against;
    await prisma.$transaction(async (tx) => {
      await tx.potProposal.update({
        where: { id: p.id },
        data: { status: isApproved ? "approved" : "rejected" },
      });
      if (isApproved && Number(p.amount) > 0) {
        const currentPot = await tx.pot.findUnique({
          where: { id: pot.id },
          select: { total_amount: true },
        });
        if (currentPot) {
          await tx.pot.update({
            where: { id: pot.id },
            data: { total_amount: Math.max(0, Number(currentPot.total_amount) - Number(p.amount)) },
          });
        }
      }
    });
  }
}
