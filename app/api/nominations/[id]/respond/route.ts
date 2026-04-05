import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import {
  respondToNomination,
  respondNominationSchema,
} from "../../../../../lib/nominations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;

    const body = await req.json();
    const parsed = respondNominationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const nomination = await respondToNomination(
      id,
      user.id,
      parsed.data.action,
      parsed.data.chosen_reason
    );

    return NextResponse.json({ data: nomination, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
