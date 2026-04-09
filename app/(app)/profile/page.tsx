import Link from "next/link";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import type { GoalWithNominator } from "../../../types";
import AvatarUpload from "../../../components/ui/AvatarUpload";
import LanguageSelector from "../../../components/ui/LanguageSelector";
import { getTranslations } from "next-intl/server";

const CATEGORY_STYLES: Record<string, { background: string; color: string }> = {
  body:          { background: "#FFE0E0", color: "#C0392B" },
  mind:          { background: "#E0E8FF", color: "#2C3E8C" },
  soul:          { background: "#E8FFE8", color: "#1A7A1A" },
  work:          { background: "#FFF3E0", color: "#B36200" },
  relationships: { background: "#FFE8F5", color: "#8C1A5C" },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [membership, tProfile, tGoals, tCommon] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: userId },
      select: { group_id: true },
    }),
    getTranslations("profile"),
    getTranslations("goals"),
    getTranslations("common"),
  ]);
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  const [currentUser, goals, pendingNomination] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { avatar_url: true, language: true },
    }),
    prisma.goal.findMany({
      where: { user_id: userId, group_id: groupId },
      include: { nominator: { select: { id: true, name: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.nomination.findFirst({
      where: { to_user_id: userId, group_id: groupId, status: "pending" },
      select: { id: true },
    }),
  ]);

  const activeGoals = goals.filter((g) => g.status === "active");
  const pausedGoals = goals.filter((g) => g.status === "paused");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const slot1 = activeGoals.find((g) => g.slot === "self") ?? null;
  const slot2 = activeGoals.find((g) => g.slot === "nominated") ?? null;

  // Streak badge: on track if all active goals have 0 consecutive misses
  const onStreak = activeGoals.length > 0 && activeGoals.every((g) => g.consecutive_misses === 0);

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

  function GoalCard({ goal }: { goal: GoalWithNominator }) {
    const catStyle = CATEGORY_STYLES[goal.category] ?? { background: "#f1efe8", color: "#888" };
    return (
      <Link
        href={`/profile/goals/${goal.id}`}
        className="block hover:opacity-90 transition-opacity"
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
              fontSize: "14px",
              color: "#1a1a2e",
              lineHeight: "1.3",
            }}
          >
            {goal.title}
          </p>
          <span
            style={{
              ...catStyle,
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
            }}
          >
            {categoryLabels[goal.category] ?? goal.category}
          </span>
        </div>
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "#666" }}>
          {frequencyLabel(goal)}
        </p>
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "#666", marginTop: "2px" }}>
          €{Number(goal.penalty_amount).toFixed(2)} {tProfile("penaltyPerWeek")}
        </p>
        {goal.nominator && (
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "11px", color: "#6c31e3", marginTop: "6px", fontWeight: 700 }}>
            {tGoals("nominatedBy")} {goal.nominator.name}
          </p>
        )}
      </Link>
    );
  }

  function EmptySlot({
    slot,
    hasPendingNomination,
  }: {
    slot: "self" | "nominated";
    hasPendingNomination: boolean;
  }) {
    const baseStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#F1EFE8",
      border: "3px dashed #B4B2A9",
      borderRadius: "16px",
      padding: "24px 12px",
      textAlign: "center",
      textDecoration: "none",
    };

    if (slot === "self") {
      return (
        <Link href="/profile/goals/new?slot=self" style={baseStyle} className="hover:opacity-80 transition-opacity">
          <p style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "13px", color: "#888" }}>
            {tGoals("addGoal")}
          </p>
        </Link>
      );
    }
    if (hasPendingNomination) {
      return (
        <Link
          href="/nominations"
          style={{ ...baseStyle, background: "#FFF3E0", border: "3px dashed #f39c12" }}
          className="hover:opacity-80 transition-opacity"
        >
          <p style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: "13px", color: "#B36200" }}>
            {tGoals("nominationWaiting")}
          </p>
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "11px", color: "#B36200", marginTop: "4px" }}>
            {tGoals("tapToReview")}
          </p>
        </Link>
      );
    }
    return (
      <Link href="/profile/goals/new?slot=nominated" style={baseStyle} className="hover:opacity-80 transition-opacity">
        <p style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "13px", color: "#888" }}>
          {tGoals("slot2Empty")}
        </p>
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
          {tGoals("fillYourself")}
        </p>
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Purple hero card */}
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
          <AvatarUpload
            name={session.user.name!}
            initialUrl={currentUser?.avatar_url ?? null}
          />
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
              {session.user.name}
            </h1>
            <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
              {session.user.email}
            </p>
          </div>
          {onStreak && (
            <span
              style={{
                background: "#F1C40F",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "12px",
                padding: "4px 10px",
                color: "#1a1a2e",
                whiteSpace: "nowrap",
              }}
            >
              🔥 On track
            </span>
          )}
        </div>
      </div>

      {/* Language selector */}
      <LanguageSelector current={currentUser?.language ?? "EN"} />

      {/* Active slots */}
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
          ⚔️ {tProfile("activeGoals")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
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
              {tProfile("slot1Label")}
            </p>
            {slot1 ? (
              <GoalCard goal={slot1 as GoalWithNominator} />
            ) : (
              <EmptySlot slot="self" hasPendingNomination={false} />
            )}
          </div>
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
              {tProfile("slot2Label")}
            </p>
            {slot2 ? (
              <GoalCard goal={slot2 as GoalWithNominator} />
            ) : (
              <EmptySlot slot="nominated" hasPendingNomination={!!pendingNomination} />
            )}
          </div>
        </div>
      </div>

      {/* Paused */}
      {pausedGoals.length > 0 && (
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
            ⏸️ {tProfile("paused")}
          </h2>
          <div className="flex flex-col gap-2">
            {pausedGoals.map((g) => (
              <GoalCard key={g.id} goal={g as GoalWithNominator} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedGoals.length > 0 && (
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
            ✅ {tProfile("completed")}
          </h2>
          <div className="flex flex-col gap-2">
            {completedGoals.map((g) => (
              <GoalCard key={g.id} goal={g as GoalWithNominator} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
