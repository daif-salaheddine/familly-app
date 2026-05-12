import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getNominationsForUser } from "../../../lib/nominations";
import NominationCard from "../../../components/nominations/NominationCard";
import { getTranslations } from "next-intl/server";

export default async function NominationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: userId },
      select: { group_id: true },
    }),
    getTranslations("nominations"),
  ]);
  if (!membership) redirect("/login");

  const nominations = await getNominationsForUser(userId, membership.group_id);

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
          📬 {t("title")}
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

      {nominations.length === 0 ? (
        <div
          style={{
            background: "#F1EFE8",
            border: "3px dashed #B4B2A9",
            borderRadius: "16px",
            padding: "48px 20px",
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
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {nominations.map((n) => (
            <NominationCard key={n.id} nomination={n} />
          ))}
        </div>
      )}
    </div>
  );
}
