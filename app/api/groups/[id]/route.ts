import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { sendGroupDeletedEmail } from "../../../../lib/email";

const renameSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

/** Verify the caller is an admin of the group. Returns the membership or throws. */
async function assertAdmin(userId: string, groupId: string) {
  const membership = await prisma.groupMember.findFirst({
    where: { user_id: userId, group_id: groupId, role: "admin" },
  });
  if (!membership) {
    throw new Response(
      JSON.stringify({ data: null, error: "Forbidden — admins only" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return membership;
}

// DELETE /api/groups/[id] — delete group and all its data (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id: groupId } = await params;

    await assertAdmin(user.id, groupId);

    // Gather data needed for emails before the transaction wipes it
    const [group, nonAdminMembers] = await Promise.all([
      prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      }),
      prisma.groupMember.findMany({
        where: { group_id: groupId, role: "member" },
        select: { user: { select: { email: true, name: true } } },
      }),
    ]);

    if (!group) {
      return NextResponse.json({ data: null, error: "Group not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // ── Pot + votes ────────────────────────────────────────────────────────
      const pot = await tx.pot.findUnique({
        where: { group_id: groupId },
        select: { id: true },
      });
      if (pot) {
        const proposalIds = await tx.potProposal
          .findMany({ where: { pot_id: pot.id }, select: { id: true } })
          .then((rows) => rows.map((r) => r.id));
        if (proposalIds.length) {
          await tx.potVote.deleteMany({ where: { proposal_id: { in: proposalIds } } });
        }
        await tx.potProposal.deleteMany({ where: { pot_id: pot.id } });
        await tx.pot.delete({ where: { id: pot.id } });
      }

      // ── Reactions + check-ins ──────────────────────────────────────────────
      const goalIds = await tx.goal
        .findMany({ where: { group_id: groupId }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id));
      if (goalIds.length) {
        await tx.reaction.deleteMany({
          where: { checkin: { goal_id: { in: goalIds } } },
        });
        await tx.checkin.deleteMany({ where: { goal_id: { in: goalIds } } });
      }

      // ── Challenges + suggestions ───────────────────────────────────────────
      const challengeIds = await tx.challenge
        .findMany({ where: { group_id: groupId }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id));
      if (challengeIds.length) {
        await tx.challenge.updateMany({
          where: { id: { in: challengeIds } },
          data: { chosen_suggestion_id: null },
        });
        await tx.challengeSuggestion.deleteMany({
          where: { challenge_id: { in: challengeIds } },
        });
        await tx.challenge.deleteMany({ where: { id: { in: challengeIds } } });
      }

      // ── Remaining group-scoped tables ──────────────────────────────────────
      await tx.penalty.deleteMany({ where: { group_id: groupId } });
      await tx.nomination.deleteMany({ where: { group_id: groupId } });
      await tx.weekFreeze.deleteMany({ where: { group_id: groupId } });
      await tx.goal.deleteMany({ where: { group_id: groupId } });
      await tx.groupMember.deleteMany({ where: { group_id: groupId } });
      await tx.group.delete({ where: { id: groupId } });
    });

    // Fire emails after successful deletion — allSettled so a bad email address
    // never causes a 500 response
    await Promise.allSettled(
      nonAdminMembers.map((m) =>
        sendGroupDeletedEmail(m.user.email, m.user.name, group.name, user.name)
      )
    );

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error(res);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id]  — rename group (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;

    await assertAdmin(user.id, id);

    const body = await req.json();
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const group = await prisma.group.update({
      where: { id },
      data: { name: parsed.data.name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ data: group, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
