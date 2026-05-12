import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/db";
import type { GoalWithNominator } from "../../../../types";
import Avatar from "../../../../components/ui/Avatar";
import { getTranslations } from "next-intl/server";

const CATEGORY_STYLES: Record<string, { background: string; color: string }> = {
  body:          { background: "#FFE0E0", color: "#C0392B" },
  mind:          { background: "#E0E8FF", color: "#2C3E8C" },
  soul:          { background: "#E8FFE8", color: "#1A7A1A" },
  work:          { background: "#FFF3E0", color: "#B36200" },
  relationships: { background: "#FFE8F5", color: "#8C1A5C" },
};

export default async function MemberPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;
  const currentUserId = session.user.id;

  const [membership, t, tGoals, tCommon] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: currentUserId },
      select: { group_id: true },
    }),
    getTranslations("members"),
    getTranslations("goals"),
    getTranslations("common"),
  ]);
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  const [targetUser, activeGoals, pendingNomination, activeChallenge] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, avatar_url: true },
      }),
      prisma.goal.findMany({
        where: { user_id: userId, group_id: groupId, status: "active" },
        include: { nominator: { select: { id: true, name: true } } },
        orderBy: { created_at: "asc" },
      }),
      prisma.nomination.findFirst({
        where: {
          from_user_id: currentUserId,
          to_user_id: userId,
          status: "pending",
        },
        select: { id: true },
      }),
      prisma.challenge.findFirst({
        where: {
          user_id: userId,
          group_id: groupId,
          status: { in: ["pending_suggestions", "pending_choice"] },
        },
        include: {
          suggestions: {
            where: { from_user_id: currentUserId },
            select: { id: true },
          },
        },
      }),
    ]);

  if (!targetUser) notFound();

  const slot1 = activeGoals.find((g) => g.slot === "self") ?? null;
  const slot2 = activeGoals.find((g) => g.slot === "nominated") ?? null;
  const totalMisses = activeGoals.reduce((sum, g) => sum + g.consecutive_misses, 0);
  const isOwnProfile = userId === currentUserId;
  const canNominate = !isOwnProfile && !pendingNomination;
  const canSuggestChallenge =
    !isOwnProfile &&
    activeChallenge !== null &&
    activeChallenge.suggestions.length === 0;

  const categoryLabels: Record<string, string> = {
    body:          tGoals("categoryBody"),
    mind:          tGoals("categoryMind"),
    soul:          tGoals("categorySoul"),
    work:          tGoals("categoryWork"),
    relationships: tGoals("categoryRelationships"),
  };

  function frequencyLabel(goal: GoalWithNominator) {
    if (goal.frequency === "times_per_week") {
      return `${goal.frequency_count}${tCommon("times")} ${tCommon("perWeek")}`;
    }
    if (goal.frequency === "daily") return tCommon("everyDay");
    return tCommon("onceAWeek");
  }

  const badgeStyle: React.CSSProperties = {
    border: "2px solid #1a1a2e",
    borderRadius: "100px",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 800,
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "2px 8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  function GoalSlot({
    label,
    goal,
  }: {
    label: string;
    goal: GoalWithNominator | null;
  }) {
    const catStyle = goal
      ? CATEGORY_STYLES[goal.category] ?? { background: "#f1efe8", color: "#888" }
      : null;

    return (
      <div className="flex flex-col gap-1">
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#888",
          }}
        >
          {label}
        </p>
        {goal ? (
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #1a1a2e",
              borderRadius: "16px",
              boxShadow: "3px 3px 0 #1a1a2e",
              padding: "14px",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#1a1a2e",
                  lineHeight: "1.3",
                }}
              >
                {goal.title}
              </p>
              {catStyle && (
                <span style={{ ...badgeStyle, ...catStyle }}>
                  {categoryLabels[goal.category] ?? goal.category}
                </span>
              )}
            </div>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "12px",
                color: "#666",
              }}
            >
              {frequencyLabel(goal as GoalWithNominator)}
            </p>
            {goal.nominator && (
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#6c31e3",
                  marginTop: "6px",
                }}
              >
                {tGoals("nominatedBy")} {goal.nominator.name}
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#F1EFE8",
              border: "3px dashed #B4B2A9",
              borderRadius: "16px",
              padding: "24px 12px",
            }}
          >
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "#aaa",
              }}
            >
              {t("empty")}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero card */}
      <div
        style={{
          background: "#6c31e3",
          border: "3px solid #1a1a2e",
          borderRadius: "20px",
          boxShadow: "4px 4px 0 #1a1a2e",
          padding: "20px",
        }}
      >
        <div className="flex items-center gap-4">
          <Avatar name={targetUser.name} url={targetUser.avatar_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h1
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "24px",
                letterSpacing: "1px",
                color: "#ffffff",
                lineHeight: 1.1,
              }}
            >
              {targetUser.name}
            </h1>
            {isOwnProfile && (
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.7)",
                  marginTop: "2px",
                }}
              >
                {targetUser.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "32px",
              color: "#1a1a2e",
              lineHeight: 1,
            }}
          >
            {activeGoals.length}
          </p>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#888",
              marginTop: "4px",
            }}
          >
            {t("activeGoals")}
          </p>
        </div>
        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "32px",
              color: totalMisses > 0 ? "#e74c3c" : "#2ecc71",
              lineHeight: 1,
            }}
          >
            {totalMisses}
          </p>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#888",
              marginTop: "4px",
            }}
          >
            {t("consecutiveMisses")}
          </p>
        </div>
      </div>

      {/* Active goals */}
      <div>
        <h2
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#1a1a2e",
            marginBottom: "12px",
          }}
        >
          ⚔️ {t("activeGoals")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <GoalSlot label={t("slot1")} goal={slot1 as GoalWithNominator | null} />
          <GoalSlot label={t("slot2")} goal={slot2 as GoalWithNominator | null} />
        </div>
      </div>

      {/* Nominate button */}
      {!isOwnProfile && (
        <div>
          {canNominate ? (
            <Link
              href={`/members/${userId}/nominate`}
              style={{
                display: "block",
                width: "100%",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "15px",
                background: "#6c31e3",
                color: "#ffffff",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                boxShadow: "2px 2px 0 #1a1a2e",
                padding: "12px 24px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {t("nominate")}
            </Link>
          ) : (
            <div
              style={{
                background: "#FFF3E0",
                border: "3px solid #f39c12",
                borderRadius: "16px",
                boxShadow: "3px 3px 0 #f39c12",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#B36200",
                }}
              >
                {t("alreadyNominated")} {targetUser.name}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Suggest challenge */}
      {canSuggestChallenge && (
        <Link
          href={`/challenges/${userId}/suggest`}
          style={{
            display: "block",
            width: "100%",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "15px",
            background: "#fff3e0",
            color: "#B36200",
            border: "3px solid #f39c12",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #f39c12",
            padding: "12px 24px",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          ⚡ {t("suggestChallenge")}
        </Link>
      )}
    </div>
  );
}
