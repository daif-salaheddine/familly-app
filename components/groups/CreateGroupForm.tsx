"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CreateGroupForm() {
  const t = useTranslations("groups");
  const router = useRouter();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = created
    ? `${window.location.origin}/join/${created.invite_code}`
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const json = await res.json();
    setPending(false);

    if (!res.ok || json.error) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    setCreated(json.data);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-center">
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎉</div>
          <h2
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "26px",
              letterSpacing: "1px",
              color: "#1a1a2e",
            }}
          >
            {t("successTitle")}
          </h2>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              color: "#555",
              marginTop: "6px",
            }}
          >
            {t("successSubtitle")}
          </p>
        </div>

        {/* Invite link box */}
        <div
          style={{
            background: "#f0ebff",
            border: "2px solid #6c31e3",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            wordBreak: "break-all",
          }}
        >
          <span
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#1a1a2e",
              flex: 1,
            }}
          >
            {inviteUrl}
          </span>
        </div>

        {/* Copy button */}
        <button
          onClick={copyLink}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "15px",
            background: copied ? "#22c55e" : "#6c31e3",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "10px 24px",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          {copied ? `✓ ${t("copied")}` : t("copyLink")}
        </button>

        {/* Navigation buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push(`/groups/${created.id}/settings`)}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              background: "#ffffff",
              color: "#1a1a2e",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            {t("goToSettings")}
          </button>
          <button
            onClick={() => router.push("/profile")}
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              background: "transparent",
              color: "#888",
              border: "none",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            {t("goToProfile")}
          </button>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="name"
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {t("nameLabel")}
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          maxLength={50}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1a1a2e",
            background: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "10px",
            padding: "10px 14px",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {error && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !name.trim()}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          background: pending || !name.trim() ? "#9b7fd4" : "#6c31e3",
          color: "#ffffff",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "10px 24px",
          cursor: pending || !name.trim() ? "not-allowed" : "pointer",
          opacity: pending || !name.trim() ? 0.7 : 1,
        }}
      >
        {pending ? t("creating") : t("createButton")}
      </button>
    </form>
  );
}
