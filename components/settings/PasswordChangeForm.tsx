"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontFamily: "Nunito, sans-serif",
  fontWeight: 700,
  fontSize: "14px",
  border: "2px solid #1a1a2e",
  borderRadius: "10px",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
};

export default function PasswordChangeForm() {
  const t = useTranslations("userSettings");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (next.length < 8) { setError(t("passwordTooShort")); return; }
    if (next !== confirm) { setError(t("passwordMismatch")); return; }

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t("errorGeneric"));
        return;
      }
      setSaved(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !saving && !!current && !!next && !!confirm;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        value={current}
        onChange={(e) => { setCurrent(e.target.value); setSaved(false); }}
        placeholder={t("currentPassword")}
        style={inputStyle}
        autoComplete="current-password"
      />
      <input
        type="password"
        value={next}
        onChange={(e) => { setNext(e.target.value); setSaved(false); }}
        placeholder={t("newPassword")}
        style={inputStyle}
        autoComplete="new-password"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setSaved(false); }}
        placeholder={t("confirmPassword")}
        style={inputStyle}
        autoComplete="new-password"
      />
      {error && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#c0392b", fontWeight: 700 }}>
          ⚠️ {error}
        </p>
      )}
      {saved && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#27ae60", fontWeight: 700 }}>
          ✅ {t("passwordChanged")}
        </p>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "14px",
          padding: "10px 20px",
          borderRadius: "100px",
          border: "2px solid #1a1a2e",
          boxShadow: canSubmit ? "2px 2px 0 #1a1a2e" : "none",
          background: canSubmit ? "#6c31e3" : "#e0e0e0",
          color: canSubmit ? "#ffffff" : "#999",
          cursor: canSubmit ? "pointer" : "default",
          alignSelf: "flex-start",
          transition: "background 0.15s",
        }}
      >
        {saving ? t("changingPassword") : t("changePassword")}
      </button>
    </form>
  );
}
