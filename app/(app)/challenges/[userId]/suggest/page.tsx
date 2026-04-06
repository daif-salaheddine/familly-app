import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import SuggestForm from "../../../../../components/challenges/SuggestForm";
import { getTranslations } from "next-intl/server";

export default async function SuggestPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;
  const currentUserId = session.user.id;

  if (userId === currentUserId) notFound();

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: currentUserId },
      select: { group_id: true },
    }),
    getTranslations("challenges"),
  ]);
  if (!membership) redirect("/login");

  const [targetUser, activeChallenge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    }),
    prisma.challenge.findFirst({
      where: {
        user_id: userId,
        group_id: membership.group_id,
        status: { in: ["pending_suggestions", "pending_choice"] },
      },
      include: {
        goal: { select: { title: true, category: true } },
        suggestions: {
          where: { from_user_id: currentUserId },
          select: { id: true },
        },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  if (!targetUser) notFound();

  const header = (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{t("suggest")}</h1>
      <p className="text-sm text-gray-500">
        {t("suggestSubtitle")} {targetUser.name}
      </p>
    </div>
  );

  if (!activeChallenge) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            {targetUser.name} — {t("noChallenge").toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  if (activeChallenge.suggestions.length > 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-medium text-amber-800">
            {t("alreadySuggested")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
          {t("myChallenge")}
        </p>
        <p className="text-sm font-medium text-gray-900">
          {activeChallenge.goal.title}
        </p>
      </div>

      <SuggestForm challengeId={activeChallenge.id} />
    </div>
  );
}
