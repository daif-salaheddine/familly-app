import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getGroupFeed } from "../../../lib/feed";
import { getActiveGroupId } from "../../../lib/group";
import FeedItem from "../../../components/feed/FeedItem";
import { getTranslations } from "next-intl/server";
import { getCurrentWeekNumber } from "../../../lib/checkins";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { joined } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [groupId, t] = await Promise.all([
    getActiveGroupId(session.user.id).catch(() => null),
    getTranslations("feed"),
  ]);
  if (!groupId) redirect("/groups/new");

  const items = await getGroupFeed(groupId);
  const weekNumber = getCurrentWeekNumber();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-2">
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
          <span
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#6c31e3",
              background: "#f0ebff",
              border: "2px solid #6c31e3",
              borderRadius: "100px",
              padding: "3px 10px",
              whiteSpace: "nowrap",
              marginTop: "4px",
            }}
          >
            {t("weekLabel", { week: weekNumber })}
          </span>
        </div>
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

      {joined && (
        <div
          style={{
            background: "#E8FFE8",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>🎉</span>
          <div>
            <p
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#1a1a2e",
                lineHeight: 1.2,
              }}
            >
              {t("joinedTitle", { name: joined })}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#555",
                marginTop: "2px",
              }}
            >
              {t("joinedSubtitle")}
            </p>
          </div>
        </div>
      )}

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
