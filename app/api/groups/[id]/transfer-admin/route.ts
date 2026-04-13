import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

const schema = z.object({
  newAdminId: z.string().uuid("Invalid user ID"),
});

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

// POST /api/groups/[id]/transfer-admin
// Promotes newAdminId to admin and demotes the current admin to member.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getUser();
    const { id: groupId } = await params;

    const callerMembership = await assertAdmin(caller.id, groupId);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { newAdminId } = parsed.data;

    if (newAdminId === caller.id) {
      return NextResponse.json(
        { data: null, error: "You are already the admin" },
        { status: 400 }
      );
    }

    const targetMembership = await prisma.groupMember.findFirst({
      where: { user_id: newAdminId, group_id: groupId },
    });
    if (!targetMembership) {
      return NextResponse.json(
        { data: null, error: "Target user is not a member of this group" },
        { status: 404 }
      );
    }

    // Swap roles in a transaction
    await prisma.$transaction([
      prisma.groupMember.update({
        where: { id: targetMembership.id },
        data: { role: "admin" },
      }),
      prisma.groupMember.update({
        where: { id: callerMembership.id },
        data: { role: "member" },
      }),
    ]);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
