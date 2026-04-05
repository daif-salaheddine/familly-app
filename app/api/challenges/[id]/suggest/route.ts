import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import { addSuggestion, addSuggestionSchema } from "../../../../../lib/challenges";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;

    const body = await req.json();
    const parsed = addSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const suggestion = await addSuggestion(id, user.id, parsed.data.description);
    return NextResponse.json({ data: suggestion, error: null }, { status: 201 });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
