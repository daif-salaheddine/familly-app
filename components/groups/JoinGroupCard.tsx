"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Avatar from "../ui/Avatar";

interface Member {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface JoinGroupCardProps {
  groupId: string;
  groupName: string;
  inviteCode: string;
  members: Member[];
  isAuthenticated: boolean;
  alreadyMember: boolean;
}

export default function JoinGroupCard({
  groupName,
  inviteCode,
  members,
  isAuthenticated,
  alreadyMember,
}: JoinGroupCardProps) {
  const t = useTranslations("join");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setPending(true);
    setError(null);

    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode }),
    });

    const json = await res.json();
    setPending(false);

    if (!res.ok || json.error) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    router.push("/feed");
  }

  // Show only up to 5 member avatars, then "+N more"
  const visibleMembers = members.slice(0, 5);
  const extraCount = members.length - visibleMembers.length;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "3px solid #1a1a2e",
        borderRadius: "20px",
        boxShadow: "4px 4px 0 #1a1a2e",
        padding: "32px 28px",
        maxWidth: "380px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        textAlign: "center",
      }}
    >
      {/* Invited label */}
      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: "#888",
          margin: 0,
        }}
      >
        {t("invited")}
      </p>

      {/* Group name */}
      <h1
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "36px",
          letterSpacing: "2px",
          color: "#1a1a2e",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {groupName}
      </h1>

      {/* Member avatars */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-center" style={{ gap: "-8px" }}>
          {visibleMembers.map((m, i) => (
            <div
              key={m.id}
              style={{
                marginLeft: i === 0 ? 0 : "-10px",
                border: "2px solid #ffffff",
                borderRadius: "50%",
                zIndex: visibleMembers.length - i,
              }}
            >
              <Avatar name={m.name} url={m.avatar_url} size="sm" />
            </div>
          ))}
          {extraCount > 0 && (
            <div
              style={{
                marginLeft: "-10px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#e5e5e5",
                border: "2px solid #ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Nunito, sans-serif",
                fontSize: "11px",
                fontWeight: 800,
                color: "#555",
              }}
            >
              +{extraCount}
            </div>
          )}
        </div>
        <span
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "#888",
          }}
        >
          {t("memberCount", { count: members.length })}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: "2px", background: "#f0f0f0", margin: "0 -4px" }} />

      {/* Action area */}
      {alreadyMember ? (
        <div className="flex flex-col gap-3">
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 800,
              color: "#22c55e",
            }}
          >
            ✓ {t("alreadyMember")}
          </p>
          <button
            onClick={() => router.push("/feed")}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              background: "#6c31e3",
              color: "#ffffff",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "12px 28px",
              cursor: "pointer",
            }}
          >
            {t("goToFeed")}
          </button>
        </div>
      ) : isAuthenticated ? (
        <div className="flex flex-col gap-3">
          {error && (
            <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>
              {error}
            </p>
          )}
          <button
            onClick={handleJoin}
            disabled={pending}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "16px",
              background: pending ? "#9b7fd4" : "#6c31e3",
              color: "#ffffff",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "12px 28px",
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? t("joining") : t("joinButton", { name: groupName })}
          </button>
        </div>
      ) : (
        <button
          onClick={() =>
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                `/join/${inviteCode}`
              )}`
            )
          }
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            background: "#6c31e3",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "12px 28px",
            cursor: "pointer",
          }}
        >
          {t("signInToJoin")}
        </button>
      )}
    </div>
  );
}
