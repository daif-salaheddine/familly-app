import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { markAllAsRead } from "../../../../lib/notifications";

export async function POST() {
  try {
    const user = await getUser();
    await markAllAsRead(user.id);
    return NextResponse.json({ data: null, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
