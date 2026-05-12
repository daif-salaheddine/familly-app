import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getGroupChallenges } from "../../../lib/challenges";
import MyChallengeCard from "../../../components/challenges/MyChallengeCard";
import OtherChallengeCard from "../../../components/challenges/OtherChallengeCard";
import { getTranslations } from "next-intl/server";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: userId },
      select: { group_id: true },
    }),
    getTranslations("challenges"),
  ]);
  if (!membership) redirect("/login");

  const challenges = await getGroupChallenges(membership.group_id);

  const myChallenge = challenges.find((c) => c.user_id === userId) ?? null;
  const otherChallenges = challenges.filter((c) => c.user_id !== userId);

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
          ⚡ {t("title")}
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
          {t("subtitle")}
        </p>
      </div>

      {/* My challenge */}
      <section className="flex flex-col gap-3">
        <h2
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          {t("myChallenge")}
        </h2>
        {myChallenge ? (
          <MyChallengeCard challenge={myChallenge} />
        ) : (
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
              {t("noChallenge")}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "12px",
                color: "#aaa",
                marginTop: "4px",
              }}
            >
              {t("keepStreak")}
            </p>
          </div>
        )}
      </section>

      {/* Other members' challenges */}
      {otherChallenges.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#1a1a2e",
            }}
          >
            👥 {t("familyChallenges")}
          </h2>
          <div className="flex flex-col gap-3">
            {otherChallenges.map((c) => (
              <OtherChallengeCard
                key={c.id}
                challenge={c}
                currentUserId={userId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
