import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { getUserGroup } from "../../../lib/goals";
import { getGroupFeed } from "../../../lib/feed";

export async function GET() {
  try {
    const user = await getUser();
    const groupId = await getUserGroup(user.id);
    const feed = await getGroupFeed(groupId);
    return NextResponse.json({ data: feed, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
