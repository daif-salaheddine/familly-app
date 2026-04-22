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
    const memberships = await prisma.groupMember.findMany({
      where: { user_id: userId },
      select: { group_id: true, role: true },
    });

    // Groups where this user is the sole member — delete them AFTER the cascade
    const groupIdsToDelete: string[] = [];

    // ── Step 1: Admin transfers + created_by transfers ────────────────────
    for (const { group_id: groupId, role } of memberships) {
      const otherMembers = await prisma.groupMember.findMany({
        where: { group_id: groupId, user_id: { not: userId } },
        orderBy: { joined_at: "asc" },
      });

      if (otherMembers.length === 0) {
        // Sole member — queue this group for deletion after user data is gone
        groupIdsToDelete.push(groupId);
      } else if (role === "admin") {
        // Promote the earliest-joined remaining member
        await prisma.groupMember.update({
          where: { id: otherMembers[0].id },
          data: { role: "admin" },
        });
      }

      // Transfer created_by if this user created the group (and others remain)
      if (otherMembers.length > 0) {
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { created_by: true },
        });
        if (group?.created_by === userId) {
          await prisma.group.update({
            where: { id: groupId },
            data: { created_by: otherMembers[0].user_id },
          });
        }
      }
    }

    // ── Step 2: Delete all user data in dependency order ──────────────────
    await prisma.$transaction(
      async (tx) => {
        // Null nominated_by on other users' goals that this user nominated
        await tx.goal.updateMany({
          where: { nominated_by: userId },
          data: { nominated_by: null },
        });

        // Pot: delete all votes on this user's proposals, then proposals, then own votes
        const myProposals = await tx.potProposal.findMany({
          where: { proposed_by: userId },
          select: { id: true },
        });
        if (myProposals.length > 0) {
          await tx.potVote.deleteMany({
            where: { proposal_id: { in: myProposals.map((p) => p.id) } },
          });
        }
        await tx.potVote.deleteMany({ where: { user_id: userId } });
        await tx.potProposal.deleteMany({ where: { proposed_by: userId } });

        // Challenges: null chosen_suggestion_id, delete all suggestions, then challenges
        const myChallenges = await tx.challenge.findMany({
          where: { user_id: userId },
          select: { id: true },
        });
        if (myChallenges.length > 0) {
          const ids = myChallenges.map((c) => c.id);
          await tx.challenge.updateMany({
            where: { id: { in: ids } },
            data: { chosen_suggestion_id: null },
          });
          await tx.challengeSuggestion.deleteMany({
            where: { challenge_id: { in: ids } },
          });
        }
        await tx.challengeSuggestion.deleteMany({ where: { from_user_id: userId } });
        await tx.challenge.deleteMany({ where: { user_id: userId } });

        // Checkins: delete all reactions on this user's checkins, then checkins
        const myCheckins = await tx.checkin.findMany({
          where: { user_id: userId },
          select: { id: true },
        });
        if (myCheckins.length > 0) {
          await tx.reaction.deleteMany({
            where: { checkin_id: { in: myCheckins.map((c) => c.id) } },
          });
        }
        await tx.reaction.deleteMany({ where: { user_id: userId } });
        await tx.checkin.deleteMany({ where: { user_id: userId } });

        // Remaining user-owned records
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

    // ── Step 3: Delete now-empty groups (all their data is already gone) ──
    for (const groupId of groupIdsToDelete) {
      const pot = await prisma.pot.findUnique({ where: { group_id: groupId } });
      if (pot) {
        // Any remaining pot proposals/votes (shouldn't be any, but clean up)
        await prisma.potVote.deleteMany({ where: { proposal: { pot_id: pot.id } } });
        await prisma.potProposal.deleteMany({ where: { pot_id: pot.id } });
        await prisma.pot.delete({ where: { id: pot.id } });
      }
      await prisma.group.delete({ where: { id: groupId } });
    }

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[user/delete]", message);
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
