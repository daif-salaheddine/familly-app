import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const schema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

// POST /api/groups/join
// Joins the group identified by invite_code.
// Sets active_group_id cookie to the joined group.
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { invite_code: parsed.data.code },
    });

    if (!group) {
      return NextResponse.json(
        { data: null, error: "Invalid invite link" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existing = await prisma.groupMember.findFirst({
      where: { group_id: group.id, user_id: user.id },
    });

    if (existing) {
      // Already a member — just switch active group and return success
      const response = NextResponse.json(
        { data: { groupId: group.id, groupName: group.name, alreadyMember: true }, error: null }
      );
      response.cookies.set("active_group_id", group.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }

    await prisma.groupMember.create({
      data: {
        group_id: group.id,
        user_id: user.id,
        role: "member",
      },
    });

    const response = NextResponse.json(
      { data: { groupId: group.id, groupName: group.name, alreadyMember: false }, error: null },
      { status: 201 }
    );
    response.cookies.set("active_group_id", group.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
