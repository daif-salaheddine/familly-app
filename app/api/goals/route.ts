import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { getActiveGroupId } from "../../../lib/group";
import {
  getGoals,
  createGoal,
  createGoalSchema,
} from "../../../lib/goals";

export async function GET() {
  try {
    const user = await getUser();
    const groupId = await getActiveGroupId(user.id);
    const goals = await getGoals(user.id, groupId);
    return NextResponse.json({ data: goals, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    const groupId = await getActiveGroupId(user.id);

    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const goal = await createGoal(user.id, groupId, parsed.data);
    return NextResponse.json({ data: goal, error: null }, { status: 201 });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
