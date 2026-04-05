import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../../lib/auth";
import { getUserGroup } from "../../../../../lib/goals";
import { prisma } from "../../../../../lib/db";

const reactSchema = z.object({
  emoji: z.enum(["💪", "🔥", "❤️", "👏"], {
    error: "Emoji must be one of: 💪 🔥 ❤️ 👏",
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const groupId = await getUserGroup(user.id);
    const { id: checkinId } = await params;

    const body = await req.json();
    const parsed = reactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify checkin exists and belongs to this group
    const checkin = await prisma.checkin.findUnique({
      where: { id: checkinId },
      include: { goal: { select: { group_id: true } } },
    });
    if (!checkin) {
      return NextResponse.json(
        { data: null, error: "Checkin not found" },
        { status: 404 }
      );
    }
    if (checkin.goal.group_id !== groupId) {
      return NextResponse.json(
        { data: null, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { emoji } = parsed.data;

    // Toggle: remove if exists, add if not
    const existing = await prisma.reaction.findFirst({
      where: { checkin_id: checkinId, user_id: user.id, emoji },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ data: { action: "removed", emoji }, error: null });
    }

    const reaction = await prisma.reaction.create({
      data: { checkin_id: checkinId, user_id: user.id, emoji },
    });
    return NextResponse.json(
      { data: { action: "added", emoji, reaction }, error: null },
      { status: 201 }
    );
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
