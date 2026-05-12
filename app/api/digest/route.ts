import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { sendDigestEmail } from "../../../lib/email";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all groups with their members and pot
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        members: {
          select: {
            user: {
              select: { id: true, name: true, email: true, language: true },
            },
          },
        },
        pot: { select: { total_amount: true } },
      },
    });

    let emailsSent = 0;

    for (const group of groups) {
      const potTotal = Number(group.pot?.total_amount ?? 0);

      for (const { user } of group.members) {
        try {
          // Fetch this user's data for the digest in parallel
          const [goals, pendingNominations, activeChallenges] = await Promise.all([
            prisma.goal.findMany({
              where: { user_id: user.id, group_id: group.id, status: "active" },
              select: { title: true, frequency: true, frequency_count: true },
            }),
            prisma.nomination.count({
              where: { to_user_id: user.id, group_id: group.id, status: "pending" },
            }),
            prisma.challenge.count({
              where: {
                user_id: user.id,
                group_id: group.id,
                status: { notIn: ["completed", "expired"] },
              },
            }),
          ]);

          await sendDigestEmail(user.email, {
            userName: user.name,
            groupName: group.name,
            goals,
            pendingNominations,
            activeChallenges,
            potTotal,
            language: user.language,
          });

          emailsSent++;
        } catch (err) {
          console.error(`[digest] failed for user ${user.id} in group ${group.id}:`, err);
        }
      }
    }

    return NextResponse.json({ data: { emailsSent }, error: null });
  } catch (err) {
    console.error("[digest]", err);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
