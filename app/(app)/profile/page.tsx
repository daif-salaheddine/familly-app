import Link from "next/link";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import type { GoalWithNominator } from "../../../types";

const CATEGORY_COLORS: Record<string, string> = {
  body: "bg-orange-100 text-orange-700",
  mind: "bg-blue-100 text-blue-700",
  soul: "bg-purple-100 text-purple-700",
  work: "bg-yellow-100 text-yellow-700",
  relationships: "bg-pink-100 text-pink-700",
};

function frequencyLabel(goal: GoalWithNominator) {
  if (goal.frequency === "times_per_week") {
    return `${goal.frequency_count}× per week`;
  }
  if (goal.frequency === "daily") return "Every day";
  return "Once a week";
}

function GoalCard({ goal }: { goal: GoalWithNominator }) {
  return (
    <Link
      href={`/profile/goals/${goal.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900 leading-snug">{goal.title}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[goal.category] ?? "bg-gray-100 text-gray-600"}`}
        >
          {goal.category}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{frequencyLabel(goal)}</p>
      <p className="mt-1 text-sm text-gray-500">
        €{Number(goal.penalty_amount).toFixed(2)} / week penalty
      </p>
      {goal.nominator && (
        <p className="mt-2 text-xs text-indigo-500">
          Nominated by {goal.nominator.name}
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
  if (slot === "self") {
    return (
      <Link
        href="/profile/goals/new?slot=self"
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-sm font-medium text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
      >
        + Add your goal
      </Link>
    );
  }
  if (hasPendingNomination) {
    return (
      <Link
        href="/nominations"
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center hover:border-amber-400 transition-colors"
      >
        <p className="text-sm font-medium text-amber-700">Nomination waiting</p>
        <p className="mt-1 text-xs text-amber-500">Tap to review →</p>
      </Link>
    );
  }
  return (
    <Link
      href="/profile/goals/new?slot=nominated"
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-indigo-400 transition-colors"
    >
      <p className="text-sm font-medium text-gray-400">Slot 2 empty</p>
      <p className="mt-1 text-xs text-gray-400 hover:text-indigo-500">
        + Fill it yourself
      </p>
    </Link>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: userId },
    select: { group_id: true },
  });
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  const [goals, pendingNomination] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{session.user.name}</h1>
        <p className="text-sm text-gray-500">{session.user.email}</p>
      </div>

      {/* Active slots */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Active goals
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500">Slot 1 — self</p>
            {slot1 ? (
              <GoalCard goal={slot1 as GoalWithNominator} />
            ) : (
              <EmptySlot slot="self" hasPendingNomination={false} />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500">Slot 2 — nominated</p>
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
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Paused
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
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Completed
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
