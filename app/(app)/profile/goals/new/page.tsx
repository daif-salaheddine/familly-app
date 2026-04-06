import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import CreateGoalForm from "../../../../../components/goals/CreateGoalForm";
import { getTranslations } from "next-intl/server";

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

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: session.user.id },
      select: { group_id: true },
    }),
    getTranslations("goals"),
  ]);
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("newGoal")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {slot === "self" ? t("slotSelf") : t("slotNominated")}
        </p>
      </div>
      <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
        <CreateGoalForm slot={slot} />
      </div>
    </div>
  );
}
