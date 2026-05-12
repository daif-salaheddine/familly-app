import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import { getActiveGroupId } from "../../../../../lib/group";
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

  const [groupId, t] = await Promise.all([
    getActiveGroupId(session.user.id).catch(() => null),
    getTranslations("goals"),
  ]);
  if (!groupId) redirect("/groups/new");

  const existing = await prisma.goal.findFirst({
    where: {
      user_id: session.user.id,
      group_id: groupId,
      slot,
      status: "active",
    },
  });
  if (existing) redirect(`/profile/goals/${existing.id}`);

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
          {t("newGoal")}
        </h1>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            color: "#888",
            marginTop: "4px",
          }}
        >
          {slot === "self" ? t("slotSelf") : t("slotNominated")}
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "24px",
        }}
      >
        <CreateGoalForm slot={slot} />
      </div>
    </div>
  );
}
