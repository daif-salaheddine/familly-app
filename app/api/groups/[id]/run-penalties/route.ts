import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";
import { calculatePenalties } from "../../../../../lib/penalties";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: groupId } = await params;
    const sessionUser = await getUser();

    // Verify caller is an admin of this group
    const membership = await prisma.groupMember.findFirst({
      where: { group_id: groupId, user_id: sessionUser.id, role: "admin" },
    });
    if (!membership) {
      return NextResponse.json(
        { data: null, error: "Forbidden — admin only" },
        { status: 403 }
      );
    }

    const summary = await calculatePenalties(groupId);

    await prisma.group.update({
      where: { id: groupId },
      data: { last_penalty_run_at: new Date() },
    });

    return NextResponse.json({ data: summary, error: null });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[run-penalties]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
