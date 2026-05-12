import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/db";

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
}

// DELETE /api/groups/[id]/members/[userId] — kick a member (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const caller = await getUser();
    const { id: groupId, userId: targetId } = await params;

    await assertAdmin(caller.id, groupId);

    if (caller.id === targetId) {
      return NextResponse.json(
        { data: null, error: "You cannot kick yourself" },
        { status: 400 }
      );
    }

    // Prevent kicking another admin
    const targetMembership = await prisma.groupMember.findFirst({
      where: { user_id: targetId, group_id: groupId },
    });
    if (!targetMembership) {
      return NextResponse.json(
        { data: null, error: "Member not found in this group" },
        { status: 404 }
      );
    }
    if (targetMembership.role === "admin") {
      return NextResponse.json(
        { data: null, error: "Cannot kick another admin — transfer admin role first" },
        { status: 400 }
      );
    }

    await prisma.groupMember.delete({ where: { id: targetMembership.id } });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
