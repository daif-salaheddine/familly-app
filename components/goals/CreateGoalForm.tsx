"use client";

import { useActionState } from "react";
import { createGoalAction } from "../../app/actions/goals";
import { useTranslations } from "next-intl";

interface Props {
  slot: "self" | "nominated";
}

const initialState = { error: null };

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

export default function CreateGoalForm({ slot }: Props) {
  const t = useTranslations("goals");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(
    createGoalAction,
    initialState
  );

  const categories = [
    { value: "body",          label: t("categoryBody") },
    { value: "mind",          label: t("categoryMind") },
    { value: "soul",          label: t("categorySoul") },
    { value: "work",          label: t("categoryWork") },
    { value: "relationships", label: t("categoryRelationships") },
  ];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slot" value={slot} />

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" style={labelStyle}>
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder={t("titlePlaceholder")}
          style={inputStyle}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label htmlFor="category" style={labelStyle}>
          {t("category")}
        </label>
        <select id="category" name="category" required style={inputStyle}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" style={labelStyle}>
          {t("frequency")}
        </label>
        <select
          id="frequency"
          name="frequency"
          required
          defaultValue="daily"
          style={inputStyle}
          onChange={(e) => {
            const countRow = document.getElementById("count-row");
            if (countRow) {
              countRow.style.display =
                e.target.value === "times_per_week" ? "flex" : "none";
            }
          }}
        >
          <option value="daily">{tCommon("everyDay")}</option>
          <option value="times_per_week">{t("frequencyTimesPerWeek")}</option>
          <option value="weekly">{tCommon("onceAWeek")}</option>
        </select>
      </div>

      {/* Frequency count — shown only for times_per_week */}
      <div id="count-row" className="flex-col gap-1" style={{ display: "none" }}>
        <label htmlFor="frequency_count" style={labelStyle}>
          {t("frequencyCount")}
        </label>
        <input
          id="frequency_count"
          name="frequency_count"
          type="number"
          min={2}
          max={7}
          defaultValue={3}
          style={inputStyle}
        />
      </div>

      {/* Penalty */}
      <div className="flex flex-col gap-1">
        <label htmlFor="penalty_amount" style={labelStyle}>
          {t("penaltyAmount")}
        </label>
        <input
          id="penalty_amount"
          name="penalty_amount"
          type="number"
          min={1}
          step={0.5}
          required
          placeholder={t("penaltyPlaceholder")}
          style={inputStyle}
        />
      </div>

      {state.error && (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#e74c3c",
          }}
        >
          {state.error}
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
        {isPending ? t("creating") : t("createGoal")}
      </button>
    </form>
  );
}
