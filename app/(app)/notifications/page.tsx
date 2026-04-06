import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getNotifications } from "../../../lib/notifications";
import NotificationList from "../../../components/notifications/NotificationList";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await getNotifications(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">Recent activity for you</p>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
