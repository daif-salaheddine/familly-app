"use client";

import { useActionState } from "react";
import { createGoalAction } from "../../app/actions/goals";

const CATEGORIES = [
  { value: "body", label: "Body" },
  { value: "mind", label: "Mind" },
  { value: "soul", label: "Soul" },
  { value: "work", label: "Work" },
  { value: "relationships", label: "Relationships" },
];

interface Props {
  slot: "self" | "nominated";
}

const initialState = { error: null };

export default function CreateGoalForm({ slot }: Props) {
  const [state, formAction, isPending] = useActionState(
    createGoalAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="slot" value={slot} />

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Goal title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. Run 3 times a week"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <label htmlFor="frequency" className="text-sm font-medium text-gray-700">
          Frequency
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
          <option value="daily">Every day</option>
          <option value="times_per_week">X times per week</option>
          <option value="weekly">Once a week</option>
        </select>
      </div>

      {/* Frequency count — shown only for times_per_week */}
      <div id="count-row" className="flex-col gap-1" style={{ display: "none" }}>
        <label
          htmlFor="frequency_count"
          className="text-sm font-medium text-gray-700"
        >
          Times per week
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
          Weekly penalty (€)
        </label>
        <input
          id="penalty_amount"
          name="penalty_amount"
          type="number"
          min={1}
          step={0.5}
          required
          placeholder="10"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-400">
          Added to the group pot each week you miss this goal.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Create goal"}
      </button>
    </form>
  );
}
