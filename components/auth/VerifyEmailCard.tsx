"use client";

import { useState } from "react";
import Link from "next/link";

export default function VerifyEmailCard({
  initialEmail,
  labels,
}: {
  initialEmail: string | null;
  labels: {
    sentTitle: string;
    sentBody: string;
    backToLogin: string;
    resend: string;
    resent: string;
    changeEmail: string;
    newEmailPlaceholder: string;
    updateEmail: string;
    back: string;
    saving: string;
    errorInUse: string;
    errorGeneric: string;
  };
}) {
  const [currentEmail, setCurrentEmail] = useState(initialEmail ?? "");
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState<string | null>(null);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearMessages() {
    setError(null);
    setResentMsg(null);
  }

  async function handleResend() {
    clearMessages();
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setResentMsg(labels.resent);
    } catch {
      // silently ignore
    } finally {
      setResending(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setChangingEmail(true);
    try {
      const res = await fetch("/api/user/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error === "This email is already in use." ? labels.errorInUse : labels.errorGeneric);
      } else {
        setCurrentEmail(newEmail);
        setNewEmail("");
        setShowChangeForm(false);
        setResentMsg(labels.resent);
      }
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setChangingEmail(false);
    }
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "3px solid #1a1a2e",
        borderRadius: "16px",
        boxShadow: "3px 3px 0 #1a1a2e",
        padding: "28px",
      }}
    >
      <div className="flex flex-col gap-4 text-center">
        <span style={{ fontSize: "48px" }}>📩</span>

        <p style={{ fontFamily: "Bangers, cursive", fontSize: "22px", letterSpacing: "1px", color: "#1a1a2e" }}>
          {labels.sentTitle}
        </p>

        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "14px", fontWeight: 600, color: "#555", lineHeight: 1.6 }}>
          {labels.sentBody}
        </p>

        {currentEmail && (
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "14px", fontWeight: 800, color: "#6c31e3", wordBreak: "break-all" }}>
            {currentEmail}
          </p>
        )}

        {error && (
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>{error}</p>
        )}
        {resentMsg && (
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#2ecc71" }}>{resentMsg}</p>
        )}

        {/* Action links */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "13px",
              background: "transparent", color: "#6c31e3", border: "none",
              padding: "0", cursor: resending ? "not-allowed" : "pointer",
              opacity: resending ? 0.5 : 1, textDecoration: "underline",
            }}
          >
            {resending ? labels.saving : labels.resend}
          </button>
          <button
            onClick={() => { clearMessages(); setShowChangeForm((v) => !v); }}
            style={{
              fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "13px",
              background: "transparent", color: "#6c31e3", border: "none",
              padding: "0", cursor: "pointer", textDecoration: "underline",
            }}
          >
            {labels.changeEmail}
          </button>
        </div>

        {/* Change email form */}
        {showChangeForm && (
          <form onSubmit={handleChangeEmail} className="flex flex-col gap-3" style={{ textAlign: "left" }}>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={labels.newEmailPlaceholder}
              style={{
                fontFamily: "Nunito, sans-serif", fontSize: "14px", fontWeight: 600,
                color: "#1a1a2e", background: "#ffffff", border: "2px solid #1a1a2e",
                borderRadius: "10px", padding: "10px 14px", outline: "none", width: "100%",
              }}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowChangeForm(false); setNewEmail(""); }}
                style={{
                  fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "13px",
                  background: "#ffffff", color: "#1a1a2e", border: "2px solid #1a1a2e",
                  borderRadius: "100px", boxShadow: "2px 2px 0 #1a1a2e",
                  padding: "8px 16px", cursor: "pointer",
                }}
              >
                {labels.back}
              </button>
              <button
                type="submit"
                disabled={changingEmail}
                style={{
                  fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: "14px",
                  background: changingEmail ? "#9b7fd4" : "#6c31e3", color: "#ffffff",
                  border: "2px solid #1a1a2e", borderRadius: "100px",
                  boxShadow: changingEmail ? "none" : "2px 2px 0 #1a1a2e",
                  padding: "8px 20px", cursor: changingEmail ? "not-allowed" : "pointer",
                  flex: 1, opacity: changingEmail ? 0.7 : 1,
                }}
              >
                {changingEmail ? labels.saving : labels.updateEmail}
              </button>
            </div>
          </form>
        )}

        <Link
          href="/login"
          style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "13px",
            color: "#888", textDecoration: "none", marginTop: "4px",
          }}
        >
          {labels.backToLogin}
        </Link>
      </div>
    </div>
  );
}
