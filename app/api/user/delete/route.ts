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
    // ── Step 1: Handle admin role in all groups ────────────────────────────
    const memberships = await prisma.groupMember.findMany({
      where: { user_id: userId },
      select: { group_id: true, role: true },
    });

    for (const membership of memberships) {
      const groupId = membership.group_id;

      if (membership.role === "admin") {
        const allMembers = await prisma.groupMember.findMany({
          where: { group_id: groupId },
          orderBy: { joined_at: "asc" },
        });

        const otherMembers = allMembers.filter((m) => m.user_id !== userId);

        if (otherMembers.length === 0) {
          // Only member — delete the whole group and its pot
          const pot = await prisma.pot.findUnique({ where: { group_id: groupId } });
          if (pot) {
            await prisma.potVote.deleteMany({ where: { proposal: { pot_id: pot.id } } });
            await prisma.potProposal.deleteMany({ where: { pot_id: pot.id } });
            await prisma.pot.delete({ where: { id: pot.id } });
          }
          await prisma.group.delete({ where: { id: groupId } });
        } else {
          // Promote the member who joined earliest (excluding self)
          const nextAdmin = otherMembers[0];
          await prisma.groupMember.update({
            where: { id: nextAdmin.id },
            data: { role: "admin" },
          });
        }
      }
    }

    // ── Step 2: Delete all user data in dependency order ──────────────────
    await prisma.$transaction(async (tx) => {
      await tx.potVote.deleteMany({ where: { user_id: userId } });
      await tx.potProposal.deleteMany({ where: { proposed_by: userId } });
      await tx.reaction.deleteMany({ where: { user_id: userId } });
      await tx.challengeSuggestion.deleteMany({ where: { from_user_id: userId } });
      await tx.challenge.deleteMany({ where: { user_id: userId } });
      await tx.weekFreeze.deleteMany({ where: { user_id: userId } });
      await tx.notification.deleteMany({ where: { user_id: userId } });
      await tx.penalty.deleteMany({ where: { user_id: userId } });
      await tx.checkin.deleteMany({ where: { user_id: userId } });
      await tx.nomination.deleteMany({
        where: { OR: [{ from_user_id: userId }, { to_user_id: userId }] },
      });
      await tx.goal.deleteMany({ where: { user_id: userId } });
      await tx.groupMember.deleteMany({ where: { user_id: userId } });
      await tx.account.deleteMany({ where: { user_id: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (err) {
    console.error("[user/delete]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
