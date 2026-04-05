import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../../../lib/auth";
import { getUserGroup } from "../../../../../../lib/goals";
import { voteOnProposal, voteSchema } from "../../../../../../lib/pot";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const groupId = await getUserGroup(user.id);
    const { id } = await params;

    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const proposal = await voteOnProposal(id, user.id, groupId, parsed.data.vote);
    return NextResponse.json({ data: proposal, error: null });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
