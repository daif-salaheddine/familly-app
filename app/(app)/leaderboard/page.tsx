import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getActiveGroupId } from "../../../lib/group";
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

// Card background per rank
const RANK_CARD: Record<number, React.CSSProperties> = {
  0: { background: "#FFF3B0", border: "3px solid #1a1a2e", boxShadow: "3px 3px 0 #1a1a2e" }, // gold
  1: { background: "#ECECEC", border: "3px solid #1a1a2e", boxShadow: "3px 3px 0 #1a1a2e" }, // silver
  2: { background: "#FFE5CC", border: "3px solid #1a1a2e", boxShadow: "3px 3px 0 #1a1a2e" }, // bronze
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [groupId, t] = await Promise.all([
    getActiveGroupId(userId).catch(() => null),
    getTranslations("leaderboard"),
  ]);
  if (!groupId) redirect("/groups/new");

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
        <h1
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          🏆 {t("title")}
        </h1>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#888",
            marginTop: "4px",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {ranked.map((entry, index) => {
          const isMe = entry.user.id === userId;
          const medal =
            index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

          const cardBase: React.CSSProperties = RANK_CARD[index] ?? {
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            boxShadow: "3px 3px 0 #1a1a2e",
          };

          return (
            <div
              key={entry.user.id}
              style={{
                ...cardBase,
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              {/* Rank / medal */}
              <div style={{ width: "36px", flexShrink: 0, textAlign: "center" }}>
                {medal ? (
                  <span style={{ fontSize: index === 0 ? "28px" : "22px" }}>{medal}</span>
                ) : (
                  <span
                    style={{
                      fontFamily: "Bangers, cursive",
                      fontSize: "20px",
                      color: "#aaa",
                    }}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar name={entry.user.name} url={entry.user.avatar_url} size="md" />

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 800,
                      fontSize: "15px",
                      color: "#1a1a2e",
                    }}
                  >
                    {entry.user.name}
                  </p>
                  {isMe && (
                    <span
                      style={{
                        background: "#6c31e3",
                        color: "#ffffff",
                        border: "2px solid #1a1a2e",
                        borderRadius: "100px",
                        fontFamily: "Nunito, sans-serif",
                        fontWeight: 800,
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "2px 8px",
                      }}
                    >
                      {t("youBadge")}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#888",
                    marginTop: "2px",
                  }}
                >
                  {entry.goalsCompleted} {t("completed")} · €{entry.totalPaid.toFixed(2)} {t("paid")}
                </p>
              </div>

              {/* Streak + rate */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <p>
                  <span
                    style={{
                      fontFamily: "Bangers, cursive",
                      fontSize: "24px",
                      color: "#1a1a2e",
                      letterSpacing: "1px",
                    }}
                  >
                    {entry.streak}
                  </span>
                  <span
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#888",
                      marginLeft: "2px",
                    }}
                  >
                    {t("streakSuffix")}
                  </span>
                </p>
                <p
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#888",
                    marginTop: "2px",
                  }}
                >
                  {`${Math.round((entry.completionRate ?? 0) * 100)}${t("rateSuffix")}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "#aaa",
          textAlign: "center",
        }}
      >
        {t("footer")}
      </p>
    </div>
  );
}
