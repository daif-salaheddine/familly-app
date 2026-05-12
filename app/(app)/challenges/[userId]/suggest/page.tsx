import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import { getActiveGroupId } from "../../../../../lib/group";
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

  const [groupId, t] = await Promise.all([
    getActiveGroupId(currentUserId).catch(() => null),
    getTranslations("challenges"),
  ]);
  if (!groupId) redirect("/groups/new");

  const [targetUser, activeChallenge] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    }),
    prisma.challenge.findFirst({
      where: {
        user_id: userId,
        group_id: groupId,
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
      <h1
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "28px",
          letterSpacing: "1px",
          color: "#1a1a2e",
        }}
      >
        ⚡ {t("suggest")}
      </h1>
      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "#888",
          marginTop: "4px",
        }}
      >
        {t("suggestSubtitle")} {targetUser.name}
      </p>
    </div>
  );

  if (!activeChallenge) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div
          style={{
            background: "#F1EFE8",
            border: "3px dashed #B4B2A9",
            borderRadius: "16px",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              color: "#888",
            }}
          >
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
        <div
          style={{
            background: "#fff3e0",
            border: "3px solid #f39c12",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #f39c12",
            padding: "24px",
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
            {t("alreadySuggested")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* Goal reference card */}
      <div
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#888",
            marginBottom: "4px",
          }}
        >
          {t("myChallenge")}
        </p>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            color: "#1a1a2e",
          }}
        >
          {activeChallenge.goal.title}
        </p>
      </div>

      <SuggestForm challengeId={activeChallenge.id} />
    </div>
  );
}
