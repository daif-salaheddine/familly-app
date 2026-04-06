"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const CATEGORIES = ["body", "mind", "soul", "work", "relationships"] as const;

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
    body: tGoals("categoryBody"),
    mind: tGoals("categoryMind"),
    soul: tGoals("categorySoul"),
    work: tGoals("categoryWork"),
    relationships: tGoals("categoryRelationships"),
  };

  const frequencies = [
    { value: "daily", label: tCommon("everyDay") },
    { value: "times_per_week", label: tGoals("frequencyCount") },
    { value: "weekly", label: tCommon("onceAWeek") },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{t("goalTitle")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder={t("nominatePlaceholder", { name: toUserName })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">{tGoals("category")}</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <label className="text-sm font-medium text-gray-700">{tGoals("frequency")}</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          <label className="text-sm font-medium text-gray-700">
            {tGoals("frequencyCount")}
          </label>
          <input
            type="number"
            min={1}
            max={7}
            value={frequencyCount}
            onChange={(e) => setFrequencyCount(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Penalty */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {t("weeklyPenalty")}
        </label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={penaltyAmount}
          onChange={(e) => setPenaltyAmount(e.target.value)}
          required
          placeholder="5.00"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {t("personalNote")}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={t("personalNotePlaceholder")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? t("sending") : t("nominateFor", { name: toUserName })}
      </button>
    </form>
  );
}
