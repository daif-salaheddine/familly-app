import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/db";
import type { GoalWithNominator } from "../../../../types";
import Avatar from "../../../../components/ui/Avatar";
import { getTranslations } from "next-intl/server";

const CATEGORY_COLORS: Record<string, string> = {
  body: "bg-orange-100 text-orange-700",
  mind: "bg-blue-100 text-blue-700",
  soul: "bg-purple-100 text-purple-700",
  work: "bg-yellow-100 text-yellow-700",
  relationships: "bg-pink-100 text-pink-700",
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
    body: tGoals("categoryBody"),
    mind: tGoals("categoryMind"),
    soul: tGoals("categorySoul"),
    work: tGoals("categoryWork"),
    relationships: tGoals("categoryRelationships"),
  };

  function frequencyLabel(goal: GoalWithNominator) {
    if (goal.frequency === "times_per_week") {
      return `${goal.frequency_count}${tCommon("times")} ${tCommon("perWeek")}`;
    }
    if (goal.frequency === "daily") return tCommon("everyDay");
    return tCommon("onceAWeek");
  }

  function GoalSlot({
    label,
    goal,
  }: {
    label: string;
    goal: GoalWithNominator | null;
  }) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {goal ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900 text-sm leading-snug">
                {goal.title}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[goal.category] ?? "bg-gray-100 text-gray-600"}`}
              >
                {categoryLabels[goal.category] ?? goal.category}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {frequencyLabel(goal as GoalWithNominator)}
            </p>
            {goal.nominator && (
              <p className="mt-1 text-xs text-indigo-500">
                {tGoals("nominatedBy")} {goal.nominator.name}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-6">
            <p className="text-xs text-gray-400">{t("empty")}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{targetUser.name}</h1>
          <p className="text-sm text-gray-500">{targetUser.email}</p>
        </div>
        <Avatar name={targetUser.name} url={targetUser.avatar_url} size="lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activeGoals.length}</p>
          <p className="text-xs text-gray-500 mt-1">{t("activeGoals")}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{totalMisses}</p>
          <p className="text-xs text-gray-500 mt-1">{t("consecutiveMisses")}</p>
        </div>
      </div>

      {/* Active goals */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t("activeGoals")}
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
              className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {t("nominate")}
            </Link>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-700">
                {t("alreadyNominated")} {targetUser.name}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Suggest challenge action button */}
      {canSuggestChallenge && (
        <Link
          href={`/challenges/${userId}/suggest`}
          className="block w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-center text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
        >
          {t("suggestChallenge")}
        </Link>
      )}
    </div>
  );
}
