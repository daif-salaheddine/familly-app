import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import GoalActions from "../../../../../components/goals/GoalActions";
import { getTranslations } from "next-intl/server";

const CATEGORY_COLORS: Record<string, string> = {
  body: "bg-orange-100 text-orange-700",
  mind: "bg-blue-100 text-blue-700",
  soul: "bg-purple-100 text-purple-700",
  work: "bg-yellow-100 text-yellow-700",
  relationships: "bg-pink-100 text-pink-700",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-700",
};

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [goal, t, tCommon] = await Promise.all([
    prisma.goal.findUnique({
      where: { id },
      include: {
        nominator: { select: { id: true, name: true } },
        checkins: { orderBy: { created_at: "desc" } },
      },
    }),
    getTranslations("goals"),
    getTranslations("common"),
  ]);

  if (!goal) notFound();

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: session.user.id, group_id: goal.group_id },
  });
  if (!membership) notFound();

  const isOwner = goal.user_id === session.user.id;

  const todayStr = new Date().toISOString().slice(0, 10);
  const checkedInToday = goal.checkins.some(
    (c) => new Date(c.checkin_date).toISOString().slice(0, 10) === todayStr
  );

  const categoryLabels: Record<string, string> = {
    body: t("categoryBody"),
    mind: t("categoryMind"),
    soul: t("categorySoul"),
    work: t("categoryWork"),
    relationships: t("categoryRelationships"),
  };

  const statusLabels: Record<string, string> = {
    active: t("statusActive"),
    paused: t("statusPaused"),
    completed: t("statusCompleted"),
  };

  function frequencyLabel(frequency: string, count: number) {
    if (frequency === "daily") return tCommon("everyDay");
    if (frequency === "times_per_week") return `${count}${tCommon("times")} ${tCommon("perWeek")}`;
    return tCommon("onceAWeek");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link href="/profile" className="text-sm text-indigo-600 hover:underline">
        {t("back")}
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {goal.title}
          </h1>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[goal.status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {statusLabels[goal.status] ?? goal.status}
          </span>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t("category")}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[goal.category] ?? "bg-gray-100 text-gray-600"}`}
            >
              {categoryLabels[goal.category] ?? goal.category}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t("slot")}</p>
            <p className="mt-1 font-medium text-gray-700 capitalize">
              {goal.slot === "self"
                ? `1 — ${t("slotSelfShort")}`
                : `2 — ${t("slotNominatedShort")}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t("frequency")}</p>
            <p className="mt-1 font-medium text-gray-700">
              {frequencyLabel(goal.frequency, goal.frequency_count)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t("penaltyAmount")}</p>
            <p className="mt-1 font-medium text-gray-700">
              €{Number(goal.penalty_amount).toFixed(2)}
            </p>
          </div>
          {goal.consecutive_misses > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {t("consecutiveMisses")}
              </p>
              <p className="mt-1 font-semibold text-red-600">
                {goal.consecutive_misses}
              </p>
            </div>
          )}
          {goal.nominator && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t("nominatedBy")}</p>
              <p className="mt-1 font-medium text-indigo-600">{goal.nominator.name}</p>
            </div>
          )}
        </div>

        {/* Actions — only for owner */}
        {isOwner && (
          <div className="border-t border-gray-100 pt-4">
            <GoalActions goalId={goal.id} status={goal.status} />
          </div>
        )}
      </div>

      {/* Proof uploads */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t("proofGallery")}
          </h2>
          {isOwner && goal.status === "active" && !checkedInToday && (
            <Link
              href={`/profile/goals/${goal.id}/checkin`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              + {t("uploadProof")}
            </Link>
          )}
          {isOwner && checkedInToday && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {t("thisWeek")} ✓
            </span>
          )}
        </div>

        {goal.checkins.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">{t("noCheckins")}</p>
            {isOwner && goal.status === "active" && (
              <Link
                href={`/profile/goals/${goal.id}/checkin`}
                className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {t("uploadProof")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {goal.checkins.map((c) => {
              const isVideo = /\.(mp4|mov|webm)$/i.test(c.media_url);
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  {isVideo ? (
                    <video
                      src={c.media_url}
                      controls
                      className="w-full aspect-square object-cover bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.media_url}
                      alt={c.caption ?? t("checkIn")}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  <div className="p-2">
                    {c.caption && (
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {c.caption}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.checkin_date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}W{c.week_number}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
