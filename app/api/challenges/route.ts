import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { getActiveGroupId } from "../../../lib/group";
import { getGroupChallenges } from "../../../lib/challenges";

export async function GET() {
  try {
    const user = await getUser();
    const groupId = await getActiveGroupId(user.id);

    const challenges = await getGroupChallenges(groupId);

    return NextResponse.json({ data: challenges, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
