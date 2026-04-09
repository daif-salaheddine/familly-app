"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { NominationWithUsers } from "../../types";
import { playLevelUp } from "../../lib/sounds";

const CATEGORY_STYLES: Record<string, { background: string; color: string }> = {
  body:          { background: "#FFE0E0", color: "#C0392B" },
  mind:          { background: "#E0E8FF", color: "#2C3E8C" },
  soul:          { background: "#E8FFE8", color: "#1A7A1A" },
  work:          { background: "#FFF3E0", color: "#B36200" },
  relationships: { background: "#FFE8F5", color: "#8C1A5C" },
};

function frequencyLabel(
  n: NominationWithUsers,
  tCommon: ReturnType<typeof useTranslations>
) {
  if (n.frequency === "times_per_week")
    return `${n.frequency_count}× ${tCommon("perWeek")}`;
  if (n.frequency === "daily") return tCommon("everyDay");
  return tCommon("onceAWeek");
}

const btnBase: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontWeight: 800,
  fontSize: "13px",
  borderRadius: "100px",
  padding: "8px 16px",
  cursor: "pointer",
  border: "2px solid #1a1a2e",
  boxShadow: "2px 2px 0 #1a1a2e",
  flex: 1,
};

export default function NominationCard({
  nomination,
}: {
  nomination: NominationWithUsers;
}) {
  const t = useTranslations("nominations");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const catStyle =
    CATEGORY_STYLES[nomination.category] ?? { background: "#f1efe8", color: "#888" };

  async function respond(action: "accept" | "decline") {
    setError(null);
    setIsFetching(true);
    try {
      const res = await fetch(`/api/nominations/${nomination.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          chosen_reason: action === "accept" ? reason || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      if (action === "accept") void playLevelUp();
      router.refresh();
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "3px solid #1a1a2e",
        borderRadius: "16px",
        boxShadow: "3px 3px 0 #1a1a2e",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "#1a1a2e",
            }}
          >
            {nomination.title}
          </p>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              color: "#888",
              marginTop: "2px",
            }}
          >
            {t("from")}{" "}
            <span style={{ fontWeight: 700, color: "#6c31e3" }}>
              {nomination.fromUser.name}
            </span>
          </p>
        </div>
        <span
          style={{
            ...catStyle,
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "3px 10px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {nomination.category}
        </span>
      </div>

      {/* Details */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          fontFamily: "Nunito, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "#666",
        }}
      >
        <span>{frequencyLabel(nomination, tCommon)}</span>
        <span>·</span>
        <span>€{Number(nomination.penalty_amount).toFixed(2)} / {tCommon("perWeek")}</span>
      </div>

      {/* Message */}
      {nomination.message && (
        <div
          style={{
            background: "#F1EFE8",
            borderLeft: "4px solid #1a1a2e",
            borderRadius: "0 8px 8px 0",
            padding: "10px 12px",
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontStyle: "italic",
            color: "#555",
          }}
        >
          &ldquo;{nomination.message}&rdquo;
        </div>
      )}

      {/* Accept reason textarea */}
      {showAccept && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reasonPlaceholder")}
          rows={2}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1a1a2e",
            background: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "10px",
            padding: "8px 12px",
            outline: "none",
            resize: "none",
            width: "100%",
          }}
        />
      )}

      {error && (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#e74c3c",
          }}
        >
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {showAccept ? (
          <>
            <button
              onClick={() => respond("accept")}
              disabled={isFetching}
              style={{
                ...btnBase,
                background: "#2ecc71",
                color: "#1a1a2e",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? t("accepting") : t("confirmAccept")}
            </button>
            <button
              onClick={() => setShowAccept(false)}
              disabled={isFetching}
              style={{
                ...btnBase,
                background: "#ffffff",
                color: "#1a1a2e",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {tCommon("cancel")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAccept(true)}
              disabled={isFetching}
              style={{
                ...btnBase,
                background: "#2ecc71",
                color: "#1a1a2e",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {t("accept")}
            </button>
            <button
              onClick={() => respond("decline")}
              disabled={isFetching}
              style={{
                ...btnBase,
                background: "#ffffff",
                color: "#1a1a2e",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              {isFetching ? t("declining") : t("decline")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
