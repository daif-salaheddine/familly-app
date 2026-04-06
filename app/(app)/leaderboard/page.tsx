import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the Monday of the current week (UTC). */
function getCurrentMonday(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d;
}

/** Returns ISO week number and year for a given Monday. */
function getWeekKey(monday: Date): string {
  const d = new Date(monday);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${week}`;
}

/**
 * Count consecutive penalty-free complete weeks ending at (currentMonday - 1 week).
 * penaltyWeekKeys: Set of "YYYY-W" strings for weeks the user got a penalty.
 */
function calcStreak(penaltyWeekKeys: Set<string>, currentMonday: Date): number {
  let streak = 0;
  const monday = new Date(currentMonday);
  monday.setUTCDate(monday.getUTCDate() - 7); // start from last complete week

  for (let i = 0; i < 52; i++) {
    if (penaltyWeekKeys.has(getWeekKey(monday))) break;
    streak++;
    monday.setUTCDate(monday.getUTCDate() - 7);
  }
  return streak;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: userId },
    select: { group_id: true },
  });
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  // Fetch everything in parallel
  const [members, allGoals, allPenalties] = await Promise.all([
    prisma.groupMember.findMany({
      where: { group_id: groupId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { joined_at: "asc" },
    }),
    prisma.goal.findMany({
      where: { group_id: groupId },
      select: { user_id: true, status: true, created_at: true },
    }),
    prisma.penalty.findMany({
      where: { group_id: groupId },
      select: { user_id: true, amount: true, period_start: true },
    }),
  ]);

  // Group by user
  const goalsByUser = new Map<string, typeof allGoals>();
  const penaltiesByUser = new Map<string, typeof allPenalties>();
  for (const g of allGoals) {
    if (!goalsByUser.has(g.user_id)) goalsByUser.set(g.user_id, []);
    goalsByUser.get(g.user_id)!.push(g);
  }
  for (const p of allPenalties) {
    if (!penaltiesByUser.has(p.user_id)) penaltiesByUser.set(p.user_id, []);
    penaltiesByUser.get(p.user_id)!.push(p);
  }

  const currentMonday = getCurrentMonday();

  // Compute stats per member
  const ranked = members
    .map(({ user }) => {
      const goals = goalsByUser.get(user.id) ?? [];
      const penalties = penaltiesByUser.get(user.id) ?? [];

      const goalsCompleted = goals.filter((g) => g.status === "completed").length;

      const totalPaid = penalties.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      // Penalty week keys for streak calculation — derived from period_start
      const penaltyWeekKeys = new Set(
        penalties.map((p) => getWeekKey(new Date(p.period_start)))
      );

      const streak = calcStreak(penaltyWeekKeys, currentMonday);

      // Completion rate: weeks active vs weeks with penalties
      const firstGoal = goals.length
        ? goals.reduce((a, b) => (a.created_at < b.created_at ? a : b))
        : null;

      let completionRate: number | null = null;
      if (firstGoal) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksActive = Math.max(
          1,
          Math.floor((currentMonday.getTime() - firstGoal.created_at.getTime()) / msPerWeek)
        );
        const penaltyWeeks = penaltyWeekKeys.size;
        completionRate = Math.max(0, (weeksActive - penaltyWeeks) / weeksActive);
      }

      return { user, streak, completionRate, goalsCompleted, totalPaid };
    })
    .sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      const rateA = a.completionRate ?? 0;
      const rateB = b.completionRate ?? 0;
      return rateB - rateA;
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500">Family accountability rankings</p>
      </div>

      <div className="flex flex-col gap-3">
        {ranked.map((entry, index) => {
          const isMe = entry.user.id === userId;
          const medal =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

          return (
            <div
              key={entry.user.id}
              className={`rounded-xl border p-4 flex items-center gap-4 ${
                isMe
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Rank */}
              <div className="w-8 shrink-0 text-center">
                {medal ? (
                  <span className="text-xl">{medal}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-400">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ${
                  isMe
                    ? "bg-indigo-200 text-indigo-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {entry.user.name[0]}
              </div>

              {/* Name + you badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-semibold text-sm ${
                      isMe ? "text-indigo-700" : "text-gray-900"
                    }`}
                  >
                    {entry.user.name}
                  </p>
                  {isMe && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                      you
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {entry.goalsCompleted} completed · €{entry.totalPaid.toFixed(2)} paid
                </p>
              </div>

              {/* Streak + rate */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-gray-900">
                  {entry.streak}
                  <span className="text-sm font-normal text-gray-400">w</span>
                </p>
                <p className="text-xs text-gray-400">
                  {entry.completionRate !== null
                    ? `${Math.round(entry.completionRate * 100)}% rate`
                    : "no data"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">
        Streak = consecutive penalty-free weeks
      </p>
    </div>
  );
}
