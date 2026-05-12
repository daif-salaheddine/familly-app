import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getNotifications } from "../../../lib/notifications";
import NotificationList from "../../../components/notifications/NotificationList";
import { getTranslations } from "next-intl/server";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [notifications, t] = await Promise.all([
    getNotifications(session.user.id),
    getTranslations("notifications"),
  ]);

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
          🔔 {t("title")}
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
      <NotificationList notifications={notifications} />
    </div>
  );
}
