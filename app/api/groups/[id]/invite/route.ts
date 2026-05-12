import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

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

// POST /api/groups/[id]/invite — regenerate invite code (admin only)
// Old links immediately stop working.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;

    await assertAdmin(user.id, id);

    const invite_code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    const group = await prisma.group.update({
      where: { id },
      data: { invite_code },
      select: { invite_code: true },
    });

    return NextResponse.json({ data: { invite_code: group.invite_code }, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
