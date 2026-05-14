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

      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={saving}
        style={{
          flexShrink: 0,
          position: "relative",
          width: "52px",
          height: "28px",
          borderRadius: "100px",
          border: "2px solid #1a1a2e",
          boxShadow: "2px 2px 0 #1a1a2e",
          background: enabled ? "#2ecc71" : "#d0cdc6",
          cursor: saving ? "default" : "pointer",
          transition: "background 0.2s",
          padding: 0,
          opacity: saving ? 0.7 : 1,
        }}
      >
        {/* Knob */}
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: enabled ? "calc(100% - 22px)" : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "2px solid #1a1a2e",
            transition: "left 0.2s",
            display: "block",
          }}
        />
      </button>
    </div>
  );
}
