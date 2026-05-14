"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function DisplayNameForm({ initialName }: { initialName: string }) {
  const t = useTranslations("userSettings");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t("errorGeneric"));
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); setSaved(false); }}
        placeholder={t("displayNamePlaceholder")}
        style={inputStyle}
        maxLength={100}
      />
      {error && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#c0392b", fontWeight: 700 }}>
          ⚠️ {error}
        </p>
      )}
      {saved && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#27ae60", fontWeight: 700 }}>
          ✅ {t("nameUpdated")}
        </p>
      )}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "14px",
          padding: "10px 20px",
          borderRadius: "100px",
          border: "2px solid #1a1a2e",
          boxShadow: saving || !name.trim() ? "none" : "2px 2px 0 #1a1a2e",
          background: saving || !name.trim() ? "#e0e0e0" : "#6c31e3",
          color: saving || !name.trim() ? "#999" : "#ffffff",
          cursor: saving || !name.trim() ? "default" : "pointer",
          alignSelf: "flex-start",
          transition: "background 0.15s",
        }}
      >
        {saving ? t("saving") : t("saveName")}
      </button>
    </div>
  );
}
