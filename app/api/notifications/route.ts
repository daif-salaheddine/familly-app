import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { getNotifications } from "../../../lib/notifications";

export async function GET() {
  try {
    const user = await getUser();
    const notifications = await getNotifications(user.id);
    return NextResponse.json({ data: notifications, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
