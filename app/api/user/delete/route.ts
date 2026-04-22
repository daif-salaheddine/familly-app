import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function DELETE() {
  let user;
  try {
    user = await getUser();
  } catch {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // ── Step 1: Transfer or delete groups ─────────────────────────────────
    // Must happen outside the transaction because it involves complex reads + writes

    const memberships = await prisma.groupMember.findMany({
      where: { user_id: userId },
      select: { group_id: true, role: true },
    });

    for (const { group_id: groupId, role } of memberships) {
      if (role === "admin") {
        const otherMembers = await prisma.groupMember.findMany({
          where: { group_id: groupId, user_id: { not: userId } },
          orderBy: { joined_at: "asc" },
        });

        if (otherMembers.length === 0) {
          // Only member — wipe the group and its pot entirely
          const pot = await prisma.pot.findUnique({ where: { group_id: groupId } });
          if (pot) {
            await prisma.potVote.deleteMany({
              where: { proposal: { pot_id: pot.id } },
            });
            await prisma.potProposal.deleteMany({ where: { pot_id: pot.id } });
            await prisma.pot.delete({ where: { id: pot.id } });
          }
          await prisma.group.delete({ where: { id: groupId } });
        } else {
          // Promote the earliest-joined member to admin
          await prisma.groupMember.update({
            where: { id: otherMembers[0].id },
            data: { role: "admin" },
          });
        }
      }

      // Transfer created_by on groups this user created (that still exist)
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { created_by: true },
      });
      if (group?.created_by === userId) {
        // Assign to any remaining member
        const newOwner = await prisma.groupMember.findFirst({
          where: { group_id: groupId, user_id: { not: userId } },
          orderBy: { joined_at: "asc" },
        });
        if (newOwner) {
          await prisma.group.update({
            where: { id: groupId },
            data: { created_by: newOwner.user_id },
          });
        }
      }
    }

    // ── Step 2: Cascade-delete all user data ──────────────────────────────
    await prisma.$transaction(
      async (tx) => {
        // Null out references to this user that can't cascade

        // Other users' goals that were nominated by this user
        await tx.goal.updateMany({
          where: { nominated_by: userId },
          data: { nominated_by: null },
        });

        // ── Pot votes & proposals ──────────────────────────────────────────
        // All votes on proposals made by this user (from any user)
        const myProposals = await tx.potProposal.findMany({
          where: { proposed_by: userId },
          select: { id: true },
        });
        if (myProposals.length > 0) {
          await tx.potVote.deleteMany({
            where: { proposal_id: { in: myProposals.map((p) => p.id) } },
          });
        }
        // This user's own votes on other proposals
        await tx.potVote.deleteMany({ where: { user_id: userId } });
        // Now safe to delete proposals
        await tx.potProposal.deleteMany({ where: { proposed_by: userId } });

        // ── Challenges & suggestions ───────────────────────────────────────
        const myChallenges = await tx.challenge.findMany({
          where: { user_id: userId },
          select: { id: true },
        });
        if (myChallenges.length > 0) {
          const challengeIds = myChallenges.map((c) => c.id);
          // Null chosen_suggestion_id so FK won't block suggestion deletion
          await tx.challenge.updateMany({
            where: { id: { in: challengeIds } },
            data: { chosen_suggestion_id: null },
          });
          // Delete all suggestions on this user's challenges (from any user)
          await tx.challengeSuggestion.deleteMany({
            where: { challenge_id: { in: challengeIds } },
          });
        }
        // Delete suggestions this user made on others' challenges
        await tx.challengeSuggestion.deleteMany({ where: { from_user_id: userId } });
        // Now safe to delete challenges
        await tx.challenge.deleteMany({ where: { user_id: userId } });

        // ── Checkins & reactions ───────────────────────────────────────────
        const myCheckins = await tx.checkin.findMany({
          where: { user_id: userId },
          select: { id: true },
        });
        if (myCheckins.length > 0) {
          // Delete all reactions on this user's checkins (from any user)
          await tx.reaction.deleteMany({
            where: { checkin_id: { in: myCheckins.map((c) => c.id) } },
          });
        }
        // Delete reactions this user left on others' checkins
        await tx.reaction.deleteMany({ where: { user_id: userId } });
        // Now safe to delete checkins
        await tx.checkin.deleteMany({ where: { user_id: userId } });

        // ── Remaining user-owned data ──────────────────────────────────────
        await tx.weekFreeze.deleteMany({ where: { user_id: userId } });
        await tx.notification.deleteMany({ where: { user_id: userId } });
        await tx.penalty.deleteMany({ where: { user_id: userId } });
        await tx.nomination.deleteMany({
          where: { OR: [{ from_user_id: userId }, { to_user_id: userId }] },
        });
        await tx.goal.deleteMany({ where: { user_id: userId } });
        await tx.groupMember.deleteMany({ where: { user_id: userId } });
        await tx.account.deleteMany({ where: { user_id: userId } });
        await tx.user.delete({ where: { id: userId } });
      },
      { timeout: 30000 }
    );

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[user/delete]", message);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
