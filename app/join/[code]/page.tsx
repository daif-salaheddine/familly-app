import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getTranslations } from "next-intl/server";
import JoinGroupCard from "../../../components/groups/JoinGroupCard";
import Link from "next/link";

export const metadata = { title: "Join group — Family Quest" };

interface Props {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const t = await getTranslations("join");

  const [session, group] = await Promise.all([
    auth(),
    prisma.group.findUnique({
      where: { invite_code: code },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar_url: true } },
          },
        },
      },
    }),
  ]);

  // ── Invalid / revoked link ────────────────────────────────────────────────
  if (!group) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#FFFBF0" }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "20px",
            boxShadow: "4px 4px 0 #1a1a2e",
            padding: "40px 32px",
            maxWidth: "360px",
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <span style={{ fontSize: "48px" }}>🔗</span>
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "28px",
              letterSpacing: "1px",
              color: "#1a1a2e",
            }}
          >
            {t("invalidTitle")}
          </h1>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              color: "#888",
            }}
          >
            {t("invalidSubtitle")}
          </p>
          <Link
            href="/"
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              color: "#6c31e3",
              textDecoration: "none",
            }}
          >
            {t("goToHome")}
          </Link>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!session?.user?.id;
  const alreadyMember = isAuthenticated
    ? group.members.some((m) => m.user_id === session!.user.id)
    : false;

  const members = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar_url: m.user.avatar_url,
  }));

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FFFBF0" }}
    >
      <JoinGroupCard
        groupId={group.id}
        groupName={group.name}
        inviteCode={code}
        members={members}
        isAuthenticated={isAuthenticated}
        alreadyMember={alreadyMember}
      />
    </div>
  );
}
