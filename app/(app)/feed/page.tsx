import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getGroupFeed } from "../../../lib/feed";
import FeedItem from "../../../components/feed/FeedItem";
import { getTranslations } from "next-intl/server";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: session.user.id },
      select: { group_id: true },
    }),
    getTranslations("feed"),
  ]);
  if (!membership) redirect("/login");

  const items = await getGroupFeed(membership.group_id);

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
          📰 {t("title")}
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

      {items.length === 0 ? (
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
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              color: "#aaa",
              marginTop: "4px",
            }}
          >
            {t("emptySubtitle")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedItem
              key={`${item.type}-${item.data.id}`}
              item={item}
              currentUserId={session.user!.id!}
            />
          ))}
        </div>
      )}
    </div>
  );
}
