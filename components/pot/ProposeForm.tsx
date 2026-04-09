"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ProposeForm() {
  const t = useTranslations("pot");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/pot/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      setDescription("");
      setOpen(false);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: "#888",
          background: "#F1EFE8",
          border: "3px dashed #B4B2A9",
          borderRadius: "16px",
          padding: "16px 20px",
          width: "100%",
          cursor: "pointer",
          textAlign: "center",
          transition: "opacity 0.15s",
        }}
      >
        + {t("propose")}
      </button>
    );
  }

  const disabled = description.trim().length === 0 || isPending;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#ffffff",
        border: "3px solid #1a1a2e",
        borderRadius: "16px",
        boxShadow: "3px 3px 0 #1a1a2e",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <p
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#1a1a2e",
        }}
      >
        {t("newProposal")}
      </p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={t("proposePlaceholder")}
        required
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
      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "11px",
          fontWeight: 600,
          color: "#aaa",
          textAlign: "right",
          marginTop: "-6px",
        }}
      >
        {description.length}/500 · {t("closesIn48h")}
      </p>

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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={disabled}
          style={{
            flex: 1,
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "14px",
            background: disabled ? "#9b77ee" : "#6c31e3",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "9px 16px",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1,
          }}
        >
          {isPending ? t("submitting") : t("submitProposal")}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setDescription(""); setError(null); }}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "14px",
            background: "#ffffff",
            color: "#1a1a2e",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "9px 16px",
            cursor: "pointer",
          }}
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
