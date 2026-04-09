"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const CATEGORIES = ["body", "mind", "soul", "work", "relationships"] as const;

const inputStyle: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  color: "#1a1a2e",
  background: "#ffffff",
  border: "2px solid #1a1a2e",
  borderRadius: "10px",
  padding: "8px 12px",
  outline: "none",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontSize: "13px",
  fontWeight: 700,
  color: "#1a1a2e",
};

export default function NominateForm({
  toUserId,
  toUserName,
}: {
  toUserId: string;
  toUserName: string;
}) {
  const t = useTranslations("nominations");
  const tGoals = useTranslations("goals");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("body");
  const [frequency, setFrequency] = useState<string>("daily");
  const [frequencyCount, setFrequencyCount] = useState(3);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const res = await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_user_id: toUserId,
        title,
        category,
        frequency,
        frequency_count: frequencyCount,
        penalty_amount: parseFloat(penaltyAmount),
        message: message || undefined,
      }),
    });

    const json = await res.json();
    setIsPending(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }

    router.push(`/members/${toUserId}`);
    router.refresh();
  }

  const categoryLabels: Record<string, string> = {
    body:          tGoals("categoryBody"),
    mind:          tGoals("categoryMind"),
    soul:          tGoals("categorySoul"),
    work:          tGoals("categoryWork"),
    relationships: tGoals("categoryRelationships"),
  };

  const frequencies = [
    { value: "daily",          label: tCommon("everyDay") },
    { value: "times_per_week", label: tGoals("frequencyCount") },
    { value: "weekly",         label: tCommon("onceAWeek") },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <label style={labelStyle}>{t("goalTitle")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder={t("nominatePlaceholder", { name: toUserName })}
          style={inputStyle}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label style={labelStyle}>{tGoals("category")}</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <label style={labelStyle}>{tGoals("frequency")}</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={inputStyle}
        >
          {frequencies.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Times per week count */}
      {frequency === "times_per_week" && (
        <div className="flex flex-col gap-1">
          <label style={labelStyle}>{tGoals("frequencyCount")}</label>
          <input
            type="number"
            min={1}
            max={7}
            value={frequencyCount}
            onChange={(e) => setFrequencyCount(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      )}

      {/* Penalty */}
      <div className="flex flex-col gap-1">
        <label style={labelStyle}>{t("weeklyPenalty")}</label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={penaltyAmount}
          onChange={(e) => setPenaltyAmount(e.target.value)}
          required
          placeholder="5.00"
          style={inputStyle}
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label style={labelStyle}>{t("personalNote")}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={t("personalNotePlaceholder")}
          style={{ ...inputStyle, resize: "none" }}
        />
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
        disabled={isPending}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          background: isPending ? "#9b77ee" : "#6c31e3",
          color: "#ffffff",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "10px 24px",
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? t("sending") : t("nominateFor", { name: toUserName })}
      </button>
    </form>
  );
}
