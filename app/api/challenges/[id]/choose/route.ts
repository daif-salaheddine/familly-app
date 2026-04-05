import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import { chooseSuggestion, chooseSuggestionSchema } from "../../../../../lib/challenges";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;

    const body = await req.json();
    const parsed = chooseSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const challenge = await chooseSuggestion(id, user.id, parsed.data.suggestion_id);
    return NextResponse.json({ data: challenge, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
