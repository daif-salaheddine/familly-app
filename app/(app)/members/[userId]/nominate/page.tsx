import { notFound } from "next/navigation";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../../lib/db";
import NominateForm from "../../../../../components/nominations/NominateForm";
import { getTranslations } from "next-intl/server";

export default async function NominatePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;

  if (userId === session.user.id) redirect(`/members/${userId}`);

  const [targetUser, t] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    }),
    getTranslations("nominations"),
  ]);
  if (!targetUser) notFound();

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
          📬 {t("nominate")}
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
          {t("nominateSubtitle")} {targetUser.name}
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
        <NominateForm toUserId={userId} toUserName={targetUser.name} />
      </div>
    </div>
  );
}
