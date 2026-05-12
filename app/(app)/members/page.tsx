import Link from "next/link";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getActiveGroupId } from "../../../lib/group";
import Avatar from "../../../components/ui/Avatar";
import { getTranslations } from "next-intl/server";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const currentUserId = session.user.id;

  const [groupId, t] = await Promise.all([
    getActiveGroupId(session.user.id).catch(() => null),
    getTranslations("members"),
  ]);
  if (!groupId) redirect("/groups/new");

  const members = await prisma.groupMember.findMany({
    where: { group_id: groupId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar_url: true } },
    },
    orderBy: { joined_at: "asc" },
  });

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
          👥 {t("title")}
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
          {members.length} {t("subtitle").toLowerCase()}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {members.map(({ user, role }) => (
          <Link
            key={user.id}
            href={`/members/${user.id}`}
            className="flex items-center gap-4 hover:opacity-90 transition-opacity"
            style={{
              background: "#ffffff",
              border: "3px solid #1a1a2e",
              borderRadius: "16px",
              boxShadow: "3px 3px 0 #1a1a2e",
              padding: "14px",
              textDecoration: "none",
            }}
          >
            <Avatar name={user.name} url={user.avatar_url} size="md" />
            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#1a1a2e",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
                {user.id === currentUserId && (
                  <span
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#888",
                      marginInlineStart: "6px",
                    }}
                  >
                    ({t("subtitle").includes("groupe") ? "vous" : "you"})
                  </span>
                )}
              </p>
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "12px",
                  color: "#888",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: "2px",
                }}
              >
                {user.email}
              </p>
            </div>
            {role === "admin" && (
              <span
                style={{
                  background: "#6c31e3",
                  color: "#ffffff",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "3px 10px",
                  flexShrink: 0,
                }}
              >
                admin
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
