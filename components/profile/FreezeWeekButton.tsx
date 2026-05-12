"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  frozen: boolean;
  freezesUsedThisMonth: number;
  limitPerMonth: number;
}

export default function FreezeWeekButton({
  groupId,
  frozen,
  freezesUsedThisMonth,
  limitPerMonth,
}: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = limitPerMonth - freezesUsedThisMonth;
  const canFreeze = !frozen && remaining > 0;

  async function handleFreeze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/freeze-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, reason: reason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error === "limit_reached") setError(t("freezeLimitReached"));
        else if (json?.error === "already_frozen") setError(t("freezeAlreadyFrozen"));
        else setError(t("freezeError"));
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(t("freezeError"));
    } finally {
      setLoading(false);
    }
  }

  if (frozen) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#e0f2fe",
          border: "2px solid #0284c7",
          borderRadius: "100px",
          padding: "6px 14px",
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          fontWeight: 800,
          color: "#0369a1",
        }}
      >
        ❄️ {t("freezeActive")}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => canFreeze && setOpen(true)}
        disabled={!canFreeze}
        title={!canFreeze ? t("freezeNoRemaining") : undefined}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: canFreeze ? "#f0f9ff" : "#f5f5f5",
          border: `2px solid ${canFreeze ? "#0284c7" : "#ccc"}`,
          borderRadius: "100px",
          padding: "6px 14px",
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          fontWeight: 800,
          color: canFreeze ? "#0369a1" : "#aaa",
          cursor: canFreeze ? "pointer" : "not-allowed",
        }}
      >
        ❄️ {t("freezeButton")}
        {remaining < limitPerMonth && (
          <span style={{ fontWeight: 600, opacity: 0.75 }}>
            ({remaining}/{limitPerMonth})
          </span>
        )}
      </button>

      {/* Confirmation modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "3px solid #1a1a2e",
              borderRadius: "16px",
              boxShadow: "4px 4px 0 #1a1a2e",
              padding: "24px",
              width: "100%",
              maxWidth: "360px",
            }}
          >
            <p
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "22px",
                letterSpacing: "1px",
                color: "#1a1a2e",
                marginBottom: "8px",
              }}
            >
              ❄️ {t("freezeModalTitle")}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#555",
                lineHeight: 1.5,
                marginBottom: "16px",
              }}
            >
              {t("freezeModalBody", { remaining: remaining - 1, limit: limitPerMonth })}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1a1a2e",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                {t("freezeReasonLabel")}
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder={t("freezeReasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1a1a2e",
                  background: "#ffffff",
                  border: "2px solid #1a1a2e",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>

            {error && (
              <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", fontWeight: 700, color: "#e74c3c", marginBottom: "12px" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1,
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "13px",
                  background: "#ffffff",
                  color: "#1a1a2e",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                {t("freezeCancel")}
              </button>
              <button
                onClick={handleFreeze}
                disabled={loading}
                style={{
                  flex: 1,
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "13px",
                  background: loading ? "#7dd3fc" : "#0284c7",
                  color: "#ffffff",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  boxShadow: "2px 2px 0 #1a1a2e",
                  padding: "8px 16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t("freezeConfirming") : t("freezeConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
