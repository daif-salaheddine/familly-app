"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SuggestForm({ challengeId }: { challengeId: string }) {
  const t = useTranslations("challenges");
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      router.push("/challenges");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const disabled = description.trim().length === 0 || isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {t("describeAction")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={t("exampleAction")}
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
          }}
        >
          {description.length}/500
        </p>
      </div>

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

      <button
        type="submit"
        disabled={disabled}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          background: disabled ? "#9b77ee" : "#6c31e3",
          color: "#ffffff",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "10px 24px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {isPending ? t("sending") : t("sendSuggestion")}
      </button>
    </form>
  );
}
