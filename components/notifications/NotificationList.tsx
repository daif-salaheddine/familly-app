"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Notification, NotificationType } from "../../app/generated/prisma/client";

const TYPE_META: Record<
  NotificationType,
  { href: string; icon: string; color: string }
> = {
  nomination_received: { href: "/nominations", icon: "🎯", color: "bg-indigo-100" },
  challenge_triggered: { href: "/challenges", icon: "⚡", color: "bg-orange-100" },
  challenge_suggestion: { href: "/challenges", icon: "💡", color: "bg-yellow-100" },
  reaction_received: { href: "/feed", icon: "💪", color: "bg-pink-100" },
  goal_missed: { href: "/profile", icon: "📉", color: "bg-red-100" },
  pot_updated: { href: "/pot", icon: "💰", color: "bg-green-100" },
  proposal_created: { href: "/pot", icon: "🗳️", color: "bg-blue-100" },
};

function timeAgo(date: Date, t: ReturnType<typeof useTranslations>): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t("minutesAgo")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t("hoursAgo")}`;
  return `${Math.floor(hours / 24)}${t("daysAgo")}`;
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const t = useTranslations("notifications");
  const router = useRouter();

  async function handleClick(notification: Notification) {
    const config = TYPE_META[notification.type];
    if (!notification.is_read) {
      void fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
    }
    router.push(config.href);
  }

  async function handleMarkAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    router.refresh();
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-4">
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{t("unread", { count: unread })}</p>
          <button
            onClick={handleMarkAll}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t("markRead")}
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full rounded-xl border text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 ${
                  n.is_read
                    ? "border-gray-200 bg-white"
                    : "border-indigo-200 bg-indigo-50"
                }`}
              >
                <div
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-base ${meta.color}`}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-snug ${
                      n.is_read ? "text-gray-600" : "font-medium text-gray-900"
                    }`}
                  >
                    {t(n.type as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.created_at, t)}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
