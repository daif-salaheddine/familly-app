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
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
