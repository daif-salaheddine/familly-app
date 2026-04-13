import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const schema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
});

// PATCH /api/user/active-group
// Sets the active_group_id cookie so all pages scope to the chosen group.
export async function PATCH(req: NextRequest) {
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

    const { groupId } = parsed.data;

    // Verify the user is actually a member of this group
    const membership = await prisma.groupMember.findFirst({
      where: { user_id: user.id, group_id: groupId },
    });
    if (!membership) {
      return NextResponse.json(
        { data: null, error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ data: { groupId }, error: null });
    response.cookies.set("active_group_id", groupId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // No maxAge — session cookie, cleared when browser closes.
      // Change to maxAge: 60 * 60 * 24 * 30 for 30-day persistence.
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
