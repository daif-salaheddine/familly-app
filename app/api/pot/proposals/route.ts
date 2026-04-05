import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { getUserGroup } from "../../../../lib/goals";
import {
  getProposals,
  createProposal,
  createProposalSchema,
} from "../../../../lib/pot";

export async function GET() {
  try {
    const user = await getUser();
    const groupId = await getUserGroup(user.id);
    const proposals = await getProposals(groupId);
    return NextResponse.json({ data: proposals, error: null });
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
    const groupId = await getUserGroup(user.id);

    const body = await req.json();
    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const proposal = await createProposal(groupId, user.id, parsed.data.description);
    return NextResponse.json({ data: proposal, error: null }, { status: 201 });
  } catch (res) {
    if (res instanceof Response) return res;
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
