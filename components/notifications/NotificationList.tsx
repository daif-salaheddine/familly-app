"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Notification, NotificationType } from "../../app/generated/prisma/client";
import { playNominationReceived, playChallengeTriggered, playPenaltyAdded } from "../../lib/sounds";

const TYPE_META: Record<
  NotificationType,
  { href: string; icon: string; bg: string; color: string }
> = {
  nomination_received: { href: "/nominations",  icon: "🎯", bg: "#E0E8FF", color: "#2C3E8C" },
  challenge_triggered: { href: "/challenges",   icon: "⚡", bg: "#FFF3E0", color: "#B36200" },
  challenge_suggestion:{ href: "/challenges",   icon: "💡", bg: "#FFF3B0", color: "#7A6000" },
  reaction_received:   { href: "/feed",         icon: "💪", bg: "#FFE8F5", color: "#8C1A5C" },
  goal_missed:         { href: "/profile",      icon: "📉", bg: "#FFE0E0", color: "#C0392B" },
  pot_updated:         { href: "/pot",          icon: "💰", bg: "#E8FFE8", color: "#1A7A1A" },
  proposal_created:    { href: "/pot",          icon: "🗳️", bg: "#E0E8FF", color: "#2C3E8C" },
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
      if (notification.type === "nomination_received") playNominationReceived();
      if (notification.type === "challenge_triggered") playChallengeTriggered();
      if (notification.type === "goal_missed")         playPenaltyAdded();
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
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#888",
            }}
          >
            {t("unread", { count: unread })}
          </p>
          <button
            onClick={handleMarkAll}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 800,
              color: "#6c31e3",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t("markRead")}
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
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
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full text-left hover:opacity-90 transition-opacity"
                style={{
                  background: n.is_read ? "#ffffff" : "#faf7ff",
                  border: n.is_read ? "3px solid #1a1a2e" : "3px solid #6c31e3",
                  borderRadius: "16px",
                  boxShadow: n.is_read
                    ? "3px 3px 0 #1a1a2e"
                    : "3px 3px 0 #6c31e3",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: meta.bg,
                    border: "2px solid #1a1a2e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  {meta.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: n.is_read ? 600 : 800,
                      fontSize: "14px",
                      color: n.is_read ? "#555" : "#1a1a2e",
                      lineHeight: "1.3",
                    }}
                  >
                    {t(n.type as Parameters<typeof t>[0])}
                  </p>
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#888",
                      marginTop: "2px",
                    }}
                  >
                    {timeAgo(n.created_at, t)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: "#6c31e3",
                      border: "2px solid #1a1a2e",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
