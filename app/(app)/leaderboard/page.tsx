import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import Avatar from "../../../components/ui/Avatar";
import { getTranslations } from "next-intl/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentMonday(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function getWeekKey(monday: Date): string {
  const d = new Date(monday);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${week}`;
}

function getMondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function calcStreak(
  penaltyWeekKeys: Set<string>,
  currentMonday: Date,
  firstGoalDate: Date | null
): number {
  if (!firstGoalDate) return 0;

  const firstGoalMonday = getMondayOf(firstGoalDate);
  const cursor = new Date(currentMonday);
  cursor.setUTCDate(cursor.getUTCDate() - 7);

  if (cursor.getTime() < firstGoalMonday.getTime()) return 0;

  let streak = 0;
  for (let i = 0; i < 52; i++) {
    if (cursor.getTime() < firstGoalMonday.getTime()) break;
    if (penaltyWeekKeys.has(getWeekKey(cursor))) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: userId },
      select: { group_id: true },
    }),
    getTranslations("leaderboard"),
  ]);
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  const [members, allGoals, allPenalties] = await Promise.all([
    prisma.groupMember.findMany({
      where: { group_id: groupId },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
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

  const ranked = members
    .map(({ user }) => {
      const goals = goalsByUser.get(user.id) ?? [];
      const penalties = penaltiesByUser.get(user.id) ?? [];

      const goalsCompleted = goals.filter((g) => g.status === "completed").length;
      const totalPaid = penalties.reduce((sum, p) => sum + Number(p.amount), 0);

      const firstGoal = goals.length
        ? goals.reduce((a, b) => (a.created_at < b.created_at ? a : b))
        : null;

      const penaltyWeekKeys = new Set(
        penalties.map((p) => getWeekKey(new Date(p.period_start)))
      );

      const streak = calcStreak(penaltyWeekKeys, currentMonday, firstGoal?.created_at ?? null);

      let completionRate: number | null = null;
      if (firstGoal) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksActive = Math.max(
          1,
          Math.floor((currentMonday.getTime() - firstGoal.created_at.getTime()) / msPerWeek)
        );
        completionRate = Math.max(0, (weeksActive - penaltyWeekKeys.size) / weeksActive);
      }

      return { user, streak, completionRate, goalsCompleted, totalPaid };
    })
    .sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return (b.completionRate ?? 0) - (a.completionRate ?? 0);
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
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
              <Avatar name={entry.user.name} url={entry.user.avatar_url} size="md" />

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
                      {t("youBadge")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {entry.goalsCompleted} {t("completed")} · €{entry.totalPaid.toFixed(2)} {t("paid")}
                </p>
              </div>

              {/* Streak + rate */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-gray-900">
                  {entry.streak}
                  <span className="text-sm font-normal text-gray-400">{t("streakSuffix")}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {`${Math.round((entry.completionRate ?? 0) * 100)}${t("rateSuffix")}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400">{t("footer")}</p>
    </div>
  );
}
