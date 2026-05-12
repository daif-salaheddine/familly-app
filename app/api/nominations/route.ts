import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { getActiveGroupId } from "../../../lib/group";
import {
  getNominationsForUser,
  getSentNominations,
  createNomination,
  createNominationSchema,
} from "../../../lib/nominations";
import { createNotification } from "../../../lib/notifications";

export async function GET() {
  try {
    const user = await getUser();
    const groupId = await getActiveGroupId(user.id);

    const [received, sent] = await Promise.all([
      getNominationsForUser(user.id, groupId),
      getSentNominations(user.id, groupId),
    ]);

    return NextResponse.json({ data: { received, sent }, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    const groupId = await getActiveGroupId(user.id);

    const body = await req.json();
    const parsed = createNominationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (parsed.data.to_user_id === user.id) {
      return NextResponse.json(
        { data: null, error: "You cannot nominate yourself" },
        { status: 400 }
      );
    }

    const nomination = await createNomination(user.id, groupId, parsed.data);
    void createNotification(parsed.data.to_user_id, "nomination_received", nomination.id);
    return NextResponse.json({ data: nomination, error: null }, { status: 201 });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
