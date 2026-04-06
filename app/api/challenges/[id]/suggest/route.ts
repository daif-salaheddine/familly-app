import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../lib/auth";
import { addSuggestion, addSuggestionSchema } from "../../../../../lib/challenges";
import { createNotification } from "../../../../../lib/notifications";
import { prisma } from "../../../../../lib/db";

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

    // Notify the challenge owner
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { user_id: true },
    });
    if (challenge) {
      void createNotification(challenge.user_id, "challenge_suggestion", suggestion.id);
    }

    return NextResponse.json({ data: suggestion, error: null }, { status: 201 });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
