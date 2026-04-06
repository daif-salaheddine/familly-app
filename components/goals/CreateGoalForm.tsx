"use client";

import { useActionState } from "react";
import { createGoalAction } from "../../app/actions/goals";
import { useTranslations } from "next-intl";

interface Props {
  slot: "self" | "nominated";
}

const initialState = { error: null };

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
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder={t("titlePlaceholder")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">
          {t("category")}
        </label>
        <select
          id="category"
          name="category"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className="text-sm font-medium text-gray-700">
          {t("frequency")}
        </label>
        <select
          id="frequency"
          name="frequency"
          required
          defaultValue="daily"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <label
          htmlFor="frequency_count"
          className="text-sm font-medium text-gray-700"
        >
          {t("frequencyCount")}
        </label>
        <input
          id="frequency_count"
          name="frequency_count"
          type="number"
          min={2}
          max={7}
          defaultValue={3}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Penalty */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="penalty_amount"
          className="text-sm font-medium text-gray-700"
        >
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
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? t("creating") : t("createGoal")}
      </button>
    </form>
  );
}
