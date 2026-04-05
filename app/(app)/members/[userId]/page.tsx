import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/db";
import type { GoalWithNominator } from "../../../../types";

const CATEGORY_COLORS: Record<string, string> = {
  body: "bg-orange-100 text-orange-700",
  mind: "bg-blue-100 text-blue-700",
  soul: "bg-purple-100 text-purple-700",
  work: "bg-yellow-100 text-yellow-700",
  relationships: "bg-pink-100 text-pink-700",
};

function frequencyLabel(goal: GoalWithNominator) {
  if (goal.frequency === "times_per_week") return `${goal.frequency_count}× per week`;
  if (goal.frequency === "daily") return "Every day";
  return "Once a week";
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;
  const currentUserId = session.user.id;

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: currentUserId },
    select: { group_id: true },
  });
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  const [targetUser, activeGoals, pendingNomination] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.goal.findMany({
      where: { user_id: userId, group_id: groupId, status: "active" },
      include: { nominator: { select: { id: true, name: true } } },
      orderBy: { created_at: "asc" },
    }),
    // Check if current user already has a pending nomination to this person
    prisma.nomination.findFirst({
      where: {
        from_user_id: currentUserId,
        to_user_id: userId,
        status: "pending",
      },
      select: { id: true },
    }),
  ]);

  if (!targetUser) notFound();

  const slot1 = activeGoals.find((g) => g.slot === "self") ?? null;
  const slot2 = activeGoals.find((g) => g.slot === "nominated") ?? null;
  const totalMisses = activeGoals.reduce(
    (sum, g) => sum + g.consecutive_misses,
    0
  );
  const isOwnProfile = userId === currentUserId;
  const canNominate = !isOwnProfile && !pendingNomination;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{targetUser.name}</h1>
          <p className="text-sm text-gray-500">{targetUser.email}</p>
        </div>
        {/* Avatar placeholder */}
        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
          {targetUser.name[0]}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activeGoals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active goals</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{totalMisses}</p>
          <p className="text-xs text-gray-500 mt-1">Consecutive misses</p>
        </div>
      </div>

      {/* Active goals */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Active goals
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Slot 1 */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500">Slot 1 — self</p>
            {slot1 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm leading-snug">
                    {slot1.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[slot1.category] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {slot1.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {frequencyLabel(slot1 as GoalWithNominator)}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-6">
                <p className="text-xs text-gray-400">Empty</p>
              </div>
            )}
          </div>

          {/* Slot 2 */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500">Slot 2 — nominated</p>
            {slot2 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm leading-snug">
                    {slot2.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[slot2.category] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {slot2.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {frequencyLabel(slot2 as GoalWithNominator)}
                </p>
                {slot2.nominator && (
                  <p className="mt-1 text-xs text-indigo-500">
                    Nominated by {slot2.nominator.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-6">
                <p className="text-xs text-gray-400">Empty</p>
              </div>
            )}
          </div>
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
              Nominate a goal
            </Link>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-700">
                You already have a pending nomination to {targetUser.name}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
