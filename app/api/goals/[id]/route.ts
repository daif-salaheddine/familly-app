import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { getActiveGroupId } from "../../../../lib/group";
import { updateGoal, pauseGoal, resumeGoal, completeGoal, deleteGoal, updateGoalSchema } from "../../../../lib/goals";
import { prisma } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const groupId = await getActiveGroupId(user.id);
    const { id } = await params;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { nominator: { select: { id: true, name: true } } },
    });

    if (!goal) {
      return NextResponse.json({ data: null, error: "Goal not found" }, { status: 404 });
    }
    if (goal.group_id !== groupId) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: goal, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status, ...fields } = parsed.data;

    let goal;
    if (status === "paused") {
      goal = await pauseGoal(id, user.id);
    } else if (status === "active") {
      goal = await resumeGoal(id, user.id);
    } else if (status === "completed") {
      goal = await completeGoal(id, user.id);
    } else {
      goal = await updateGoal(id, user.id, fields);
    }

    return NextResponse.json({ data: goal, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;
    await deleteGoal(id, user.id);
    return NextResponse.json({ data: null, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
