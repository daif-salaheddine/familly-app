import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { calculatePenalties } from "../../../../lib/penalties";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { data: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const groups = await prisma.group.findMany({ select: { id: true } });
    const now = new Date();

    const summaries = await Promise.all(
      groups.map((g) => calculatePenalties(g.id))
    );

    // Stamp last_penalty_run_at on every group so admins can detect a missed run
    await prisma.group.updateMany({
      where: { id: { in: groups.map((g) => g.id) } },
      data: { last_penalty_run_at: now },
    });

    const totals = summaries.reduce(
      (acc, s) => ({
        goalsChecked: acc.goalsChecked + s.goalsChecked,
        penaltiesCreated: acc.penaltiesCreated + s.penaltiesCreated,
        challengesTriggered: acc.challengesTriggered + s.challengesTriggered,
      }),
      { goalsChecked: 0, penaltiesCreated: 0, challengesTriggered: 0 }
    );

    return NextResponse.json({
      data: { groups: summaries, totals },
      error: null,
    });
  } catch (err) {
    console.error("[penalties/weekly]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
