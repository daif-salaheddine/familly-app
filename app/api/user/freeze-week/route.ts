import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { getUser } from "../../../../lib/auth";
import { getCurrentWeekPeriod } from "../../../../lib/penalties";
import { getCurrentWeekNumber } from "../../../../lib/checkins";

const schema = z.object({
  group_id: z.string().min(1),
  reason: z.string().max(200).optional(),
});

const FREEZE_LIMIT_PER_MONTH = 2;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { group_id, reason } = parsed.data;

  // Verify user is a member of this group
  const membership = await prisma.groupMember.findFirst({
    where: { user_id: user.id, group_id },
  });
  if (!membership) {
    return NextResponse.json({ data: null, error: "Not a group member" }, { status: 403 });
  }

  const { weekNumber, year } = getCurrentWeekPeriod();

  // Check if already frozen this week for this group
  const existing = await prisma.weekFreeze.findUnique({
    where: {
      user_id_group_id_week_number_year: {
        user_id: user.id,
        group_id,
        week_number: weekNumber,
        year,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { data: null, error: "already_frozen" },
      { status: 409 }
    );
  }

  // Count freezes this calendar month (across all groups)
  const monthStart = new Date(Date.UTC(year, new Date().getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(year, new Date().getUTCMonth() + 1, 1));

  const monthCount = await prisma.weekFreeze.count({
    where: {
      user_id: user.id,
      created_at: { gte: monthStart, lt: monthEnd },
    },
  });

  if (monthCount >= FREEZE_LIMIT_PER_MONTH) {
    return NextResponse.json(
      { data: null, error: "limit_reached" },
      { status: 409 }
    );
  }

  const freeze = await prisma.weekFreeze.create({
    data: {
      user_id: user.id,
      group_id,
      week_number: weekNumber,
      year,
      reason: reason ?? null,
    },
  });

  return NextResponse.json({ data: { freeze }, error: null });
}

// Allow reading current freeze status
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const group_id = req.nextUrl.searchParams.get("group_id");
  if (!group_id) {
    return NextResponse.json({ data: null, error: "group_id required" }, { status: 400 });
  }

  const { weekNumber, year } = getCurrentWeekPeriod();

  const freeze = await prisma.weekFreeze.findUnique({
    where: {
      user_id_group_id_week_number_year: {
        user_id: user.id,
        group_id,
        week_number: weekNumber,
        year,
      },
    },
  });

  // Count freezes this calendar month
  const monthStart = new Date(Date.UTC(year, new Date().getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(year, new Date().getUTCMonth() + 1, 1));
  const monthCount = await prisma.weekFreeze.count({
    where: {
      user_id: user.id,
      created_at: { gte: monthStart, lt: monthEnd },
    },
  });

  return NextResponse.json({
    data: {
      frozen: !!freeze,
      freezesUsedThisMonth: monthCount,
      limitPerMonth: FREEZE_LIMIT_PER_MONTH,
    },
    error: null,
  });
}
