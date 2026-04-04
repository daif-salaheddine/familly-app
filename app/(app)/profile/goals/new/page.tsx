import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import CreateGoalForm from "../../../../../components/goals/CreateGoalForm";

export const metadata = { title: "New Goal — Family App" };

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slot: rawSlot } = await searchParams;
  const slot: "self" | "nominated" =
    rawSlot === "nominated" ? "nominated" : "self";

  // Guard: if slot is already taken, redirect back
  const membership = await prisma.groupMember.findFirst({
    where: { user_id: session.user.id },
    select: { group_id: true },
  });
  if (!membership) redirect("/profile");

  const existing = await prisma.goal.findFirst({
    where: {
      user_id: session.user.id,
      group_id: membership.group_id,
      slot,
      status: "active",
    },
  });
  if (existing) redirect(`/profile/goals/${existing.id}`);

  const slotLabel = slot === "self" ? "Slot 1 — self-chosen" : "Slot 2 — self-filled";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">New goal</h1>
        <p className="mt-1 text-sm text-gray-500">{slotLabel}</p>
      </div>
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        <CreateGoalForm slot={slot} />
      </div>
    </div>
  );
}
