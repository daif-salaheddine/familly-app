import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import { markAsRead } from "../../../../../lib/notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;
    await markAsRead(id, user.id);
    return NextResponse.json({ data: null, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
