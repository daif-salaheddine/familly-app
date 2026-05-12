import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { closeExpiredProposals } from "../../../../../lib/pot";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({ select: { id: true } });
  await Promise.all(groups.map((g) => closeExpiredProposals(g.id)));

  return NextResponse.json({ data: { closed: groups.length }, error: null });
}
