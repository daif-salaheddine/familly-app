import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getActiveGroupId } from "../../../lib/group";
import { getTranslations } from "next-intl/server";

// ─── Date helpers (mirrors leaderboard logic) ─────────────────────────────────

function getCurrentMonday(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function getMondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

function getISOWeekNumber(monday: Date): number {
  const d = new Date(monday);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Current streak: penalty-free completed weeks counting back from last week. */
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

/** Best streak: longest consecutive penalty-free run across full history. */
function calcBestStreak(
  penaltyWeekKeys: Set<string>,
  firstGoalDate: Date | null,
  currentMonday: Date
): number {
  if (!firstGoalDate) return 0;
  const firstGoalMonday = getMondayOf(firstGoalDate);
  const lastCompletedWeek = new Date(currentMonday);
  lastCompletedWeek.setUTCDate(lastCompletedWeek.getUTCDate() - 7);

  let best = 0;
  let current = 0;
  const cursor = new Date(firstGoalMonday);
  while (cursor <= lastCompletedWeek) {
    if (!penaltyWeekKeys.has(getWeekKey(cursor))) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return best;
}

/** Last 8 completed weeks (not including current week). */
function getLast8Weeks(currentMonday: Date): Date[] {
  const weeks: Date[] = [];
  for (let i = 8; i >= 1; i--) {
    const monday = new Date(currentMonday);
    monday.setUTCDate(monday.getUTCDate() - i * 7);
    weeks.push(monday);
  }
  return weeks;
}

// ─── Category colours ────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { background: string; color: string }> = {
  body:          { background: "#FFE0E0", color: "#C0392B" },
  mind:          { background: "#E0E8FF", color: "#2C3E8C" },
  soul:          { background: "#E8FFE8", color: "#1A7A1A" },
  work:          { background: "#FFF3E0", color: "#B36200" },
  relationships: { background: "#FFE8F5", color: "#8C1A5C" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [groupId, t] = await Promise.all([
    getActiveGroupId(userId).catch(() => null),
    getTranslations("stats"),
  ]);
  if (!groupId) redirect("/groups/new");

  const [goals, penalties, challenges] = await Promise.all([
    prisma.goal.findMany({
      where: { user_id: userId, group_id: groupId },
      select: { id: true, status: true, category: true, created_at: true },
    }),
    prisma.penalty.findMany({
      where: { user_id: userId, group_id: groupId },
      select: { amount: true, period_start: true },
    }),
    prisma.challenge.findMany({
      where: { user_id: userId, group_id: groupId },
      select: { status: true },
    }),
  ]);

  const goalIds = goals.map((g) => g.id);
  const checkins =
    goalIds.length > 0
      ? await prisma.checkin.findMany({
          where: { goal_id: { in: goalIds } },
          select: { count: true },
        })
      : [];

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalPaid = penalties.reduce((s, p) => s + Number(p.amount), 0);
  const totalChallenges = challenges.length;
  const completedChallenges = challenges.filter((c) => c.status === "completed").length;

  const totalCheckinsSubmitted = checkins.length;
  const totalSessions = checkins.reduce((s, c) => s + c.count, 0);

  const currentMonday = getCurrentMonday();
  const firstGoal = goals.length
    ? goals.reduce((a, b) => (a.created_at < b.created_at ? a : b))
    : null;

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksActive = firstGoal
    ? Math.max(
        1,
        Math.floor(
          (currentMonday.getTime() - getMondayOf(firstGoal.created_at).getTime()) / msPerWeek
        )
      )
    : 1;
  const avgPerWeek = firstGoal ? totalSessions / weeksActive : 0;

  const penaltyWeekKeys = new Set(
    penalties.map((p) => getWeekKey(getMondayOf(new Date(p.period_start))))
  );
  const currentStreak = calcStreak(penaltyWeekKeys, currentMonday, firstGoal?.created_at ?? null);
  const bestStreak = calcBestStreak(penaltyWeekKeys, firstGoal?.created_at ?? null, currentMonday);

  // Category counts
  const categoryCounts = new Map<string, number>();
  for (const g of goals) {
    categoryCounts.set(g.category, (categoryCounts.get(g.category) ?? 0) + 1);
  }

  // Weekly chart data
  const last8Weeks = getLast8Weeks(currentMonday);
  const firstGoalMonday = firstGoal ? getMondayOf(firstGoal.created_at) : null;
  const weeklyData = last8Weeks.map((monday) => ({
    label: `W${getISOWeekNumber(monday)}`,
    hasPenalty: penaltyWeekKeys.has(getWeekKey(monday)),
    beforeFirstGoal: !firstGoalMonday || monday < firstGoalMonday,
  }));

  // ── Shared card style ─────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "3px solid #1a1a2e",
    borderRadius: "16px",
    boxShadow: "3px 3px 0 #1a1a2e",
    padding: "16px",
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "Bangers, cursive",
    fontSize: "16px",
    letterSpacing: "1px",
    color: "#1a1a2e",
    marginBottom: "12px",
  };

  function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
    return (
      <div style={{ ...card, textAlign: "center" }}>
        <p
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "28px",
            letterSpacing: "1px",
            color: accent ?? "#1a1a2e",
            lineHeight: 1.1,
          }}
        >
          {value}
        </p>
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "11px", fontWeight: 700, color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </p>
      </div>
    );
  }

  if (totalGoals === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 style={{ fontFamily: "Bangers, cursive", fontSize: "28px", letterSpacing: "1px", color: "#1a1a2e" }}>
          📊 {t("title")}
        </h1>
        <div
          style={{
            background: "#F1EFE8",
            border: "3px dashed #B4B2A9",
            borderRadius: "16px",
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "14px", color: "#888" }}>
            {t("noData")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 style={{ fontFamily: "Bangers, cursive", fontSize: "28px", letterSpacing: "1px", color: "#1a1a2e" }}>
        📊 {t("title")}
      </h1>
      <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 600, color: "#888", marginTop: "-8px" }}>
        {t("subtitle")}
      </p>

      {/* 2×2 summary grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={totalGoals} label={t("totalGoals")} />
        <StatCard value={completedGoals} label={t("completed")} accent="#27ae60" />
        <StatCard value={`€${totalPaid.toFixed(2)}`} label={t("totalPaid")} accent="#e74c3c" />
        <StatCard value={currentStreak} label={t("currentStreak")} accent="#6c31e3" />
      </div>

      {/* Best streak — full-width yellow card */}
      <div
        style={{
          background: "#FFF3B0",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontFamily: "Bangers, cursive", fontSize: "16px", letterSpacing: "1px", color: "#1a1a2e" }}>
            🏆 {t("bestStreak")}
          </p>
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "#888", marginTop: "2px" }}>
            {t("streakUnit")}
          </p>
        </div>
        <p style={{ fontFamily: "Bangers, cursive", fontSize: "40px", letterSpacing: "1px", color: "#1a1a2e" }}>
          {bestStreak}
        </p>
      </div>

      {/* Weekly completion chart */}
      <div style={card}>
        <p style={sectionTitle}>📈 {t("weeklyChart")}</p>
        <div className="flex gap-2 justify-end" style={{ marginBottom: "8px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "Nunito, sans-serif", fontSize: "11px", color: "#888" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", background: "#2ecc71", border: "1.5px solid #1a1a2e", borderRadius: "2px" }} />
            {t("clean")}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "Nunito, sans-serif", fontSize: "11px", color: "#888" }}>
            <span style={{ display: "inline-block", width: "10px", height: "10px", background: "#e74c3c", border: "1.5px solid #1a1a2e", borderRadius: "2px" }} />
            {t("missed")}
          </span>
        </div>
        <svg viewBox="0 0 320 80" style={{ width: "100%", height: "80px" }} aria-hidden="true">
          {weeklyData.map((week, i) => {
            const x = i * 40 + 4;
            const fill = week.beforeFirstGoal ? "#d0cdc6" : week.hasPenalty ? "#e74c3c" : "#2ecc71";
            const barHeight = week.beforeFirstGoal ? 40 : week.hasPenalty ? 40 : 60;
            const barY = 64 - barHeight;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={barY}
                  width={32}
                  height={barHeight}
                  rx={4}
                  fill={fill}
                  stroke="#1a1a2e"
                  strokeWidth={1.5}
                />
                <text
                  x={x + 16}
                  y={76}
                  textAnchor="middle"
                  fontFamily="Nunito, sans-serif"
                  fontSize={9}
                  fill="#888"
                >
                  {week.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Category breakdown */}
      {categoryCounts.size > 0 && (
        <div style={card}>
          <p style={sectionTitle}>🏷️ {t("categoryBreakdown")}</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(categoryCounts.entries()).map(([cat, count]) => {
              const style = CATEGORY_STYLES[cat] ?? { background: "#f1efe8", color: "#888" };
              return (
                <span
                  key={cat}
                  style={{
                    ...style,
                    border: "2px solid #1a1a2e",
                    borderRadius: "100px",
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 800,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "4px 12px",
                  }}
                >
                  {cat} · {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Check-in activity */}
      <div style={card}>
        <p style={sectionTitle}>📸 {t("checkinActivity")}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={totalCheckinsSubmitted} label={t("totalCheckins")} />
          <StatCard value={avgPerWeek.toFixed(1)} label={t("avgPerWeek")} />
        </div>
      </div>

      {/* Challenges */}
      <div style={card}>
        <p style={sectionTitle}>⚡ {t("challenges")}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard value={totalChallenges} label={t("triggered")} accent="#f39c12" />
          <StatCard value={completedChallenges} label={t("completedChallenges")} accent="#27ae60" />
        </div>
      </div>
    </div>
  );
}
