import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

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
