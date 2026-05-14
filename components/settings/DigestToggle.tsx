"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function DigestToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations("userSettings");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (saving) return;
    const newValue = !enabled;
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest_enabled: newValue }),
      });
      if (res.ok) setEnabled(newValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "14px", color: "#1a1a2e" }}>
          {t("digestLabel")}
        </p>
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "#888", marginTop: "2px", lineHeight: 1.4 }}>
          {t("digestHint")}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        style={{
          flexShrink: 0,
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "13px",
          padding: "8px 18px",
          borderRadius: "100px",
          border: "2px solid #1a1a2e",
          boxShadow: "2px 2px 0 #1a1a2e",
          background: enabled ? "#2ecc71" : "#ffffff",
          color: enabled ? "#1a1a2e" : "#888",
          cursor: saving ? "default" : "pointer",
          transition: "background 0.15s, color 0.15s",
          whiteSpace: "nowrap",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {enabled ? t("digestEnabled") : t("digestDisabled")}
      </button>
    </div>
  );
}
