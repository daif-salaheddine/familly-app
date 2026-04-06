"use client";

import { useRouter } from "next/navigation";
import type { Notification, NotificationType } from "../../app/generated/prisma/client";

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; href: string; icon: string; color: string }
> = {
  nomination_received: {
    label: "You have a new goal nomination",
    href: "/nominations",
    icon: "🎯",
    color: "bg-indigo-100",
  },
  challenge_triggered: {
    label: "You have a new challenge!",
    href: "/challenges",
    icon: "⚡",
    color: "bg-orange-100",
  },
  challenge_suggestion: {
    label: "Someone suggested a challenge action",
    href: "/challenges",
    icon: "💡",
    color: "bg-yellow-100",
  },
  reaction_received: {
    label: "Someone reacted to your check-in",
    href: "/feed",
    icon: "💪",
    color: "bg-pink-100",
  },
  goal_missed: {
    label: "You missed a goal this week",
    href: "/profile",
    icon: "📉",
    color: "bg-red-100",
  },
  pot_updated: {
    label: "The group pot was updated",
    href: "/pot",
    icon: "💰",
    color: "bg-green-100",
  },
  proposal_created: {
    label: "A new reward proposal was created",
    href: "/pot",
    icon: "🗳️",
    color: "bg-blue-100",
  },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();

  async function handleClick(notification: Notification) {
    const config = TYPE_CONFIG[notification.type];
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
          <p className="text-xs text-gray-500">{unread} unread</p>
          <button
            onClick={handleMarkAll}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type];
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
                  className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-base ${config.color}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-snug ${
                      n.is_read ? "text-gray-600" : "font-medium text-gray-900"
                    }`}
                  >
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.created_at)}
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
