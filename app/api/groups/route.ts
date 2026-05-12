import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Name is too long"),
});

// POST /api/groups
// Creates a new group. The caller becomes the admin and the group's first member.
// Also creates an empty Pot for the group.
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();

    const body = await req.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const invite_code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: parsed.data.name,
          created_by: user.id,
          invite_code,
        },
      });

      await tx.groupMember.create({
        data: {
          group_id: newGroup.id,
          user_id: user.id,
          role: "admin",
        },
      });

      await tx.pot.create({
        data: {
          group_id: newGroup.id,
          total_amount: 0,
        },
      });

      return newGroup;
    });

    const response = NextResponse.json(
      { data: { id: group.id, name: group.name, invite_code: group.invite_code }, error: null },
      { status: 201 }
    );

    // Set the new group as the active group immediately
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
