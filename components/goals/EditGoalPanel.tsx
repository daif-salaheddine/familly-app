"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const CATEGORIES = ["body", "mind", "soul", "work", "relationships"] as const;

interface Props {
  goalId: string;
  initial: {
    title: string;
    category: string;
    frequency: string;
    frequency_count: number;
    penalty_amount: number;
  };
}

export default function EditGoalPanel({ goalId, initial }: Props) {
  const t = useTranslations("goals");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [frequency, setFrequency] = useState(initial.frequency);
  const [frequencyCount, setFrequencyCount] = useState(initial.frequency_count);
  const [penalty, setPenalty] = useState(String(initial.penalty_amount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    // Reset to initial values on cancel
    setTitle(initial.title);
    setCategory(initial.category);
    setFrequency(initial.frequency);
    setFrequencyCount(initial.frequency_count);
    setPenalty(String(initial.penalty_amount));
    setError(null);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const penaltyNum = parseFloat(penalty);
    if (isNaN(penaltyNum) || penaltyNum <= 0) {
      setError(t("editInvalidPenalty"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          frequency,
          frequency_count: frequency === "times_per_week" ? frequencyCount : 1,
          penalty_amount: penaltyNum,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? t("editError"));
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError(t("editError"));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a1a2e",
    background: "#ffffff",
    border: "2px solid #1a1a2e",
    borderRadius: "10px",
    padding: "9px 12px",
    outline: "none",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    color: "#1a1a2e",
    display: "block",
    marginBottom: "5px",
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "13px",
          background: open ? "#f1efe8" : "#ffffff",
          color: "#1a1a2e",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "7px 16px",
          cursor: "pointer",
        }}
      >
        ✏️ {t("editGoal")}
      </button>

      {/* Inline edit form */}
      {open && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "16px",
            background: "#FFFBF0",
            border: "2px solid #1a1a2e",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <p
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#1a1a2e",
              marginBottom: "2px",
            }}
          >
            ✏️ {t("editGoal")}
          </p>

          {/* Title */}
          <div>
            <label style={labelStyle}>{t("title")}</label>
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>{t("category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category${c.charAt(0).toUpperCase()}${c.slice(1)}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label style={labelStyle}>{t("frequency")}</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={inputStyle}
            >
              <option value="daily">{t("frequencyDaily")}</option>
              <option value="times_per_week">{t("frequencyTimesPerWeek")}</option>
              <option value="weekly">{t("frequencyWeekly")}</option>
            </select>
          </div>

          {/* Times per week */}
          {frequency === "times_per_week" && (
            <div>
              <label style={labelStyle}>{t("frequencyCount")}</label>
              <input
                type="number"
                min={1}
                max={7}
                value={frequencyCount}
                onChange={(e) => setFrequencyCount(Number(e.target.value))}
                style={{ ...inputStyle, width: "80px" }}
              />
            </div>
          )}

          {/* Penalty */}
          <div>
            <label style={labelStyle}>{t("penaltyAmount")}</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              required
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              placeholder={t("penaltyPlaceholder")}
              style={{ ...inputStyle, width: "120px" }}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                background: "#ffffff",
                color: "#1a1a2e",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                padding: "8px 18px",
                cursor: "pointer",
              }}
            >
              {t("editCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                background: loading ? "#9b7fd4" : "#6c31e3",
                color: "#ffffff",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                boxShadow: "2px 2px 0 #1a1a2e",
                padding: "8px 18px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? t("editSaving") : t("editSave")}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
