"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NominationWithUsers } from "../../types";

const CATEGORY_COLORS: Record<string, string> = {
  body: "bg-orange-100 text-orange-700",
  mind: "bg-blue-100 text-blue-700",
  soul: "bg-purple-100 text-purple-700",
  work: "bg-yellow-100 text-yellow-700",
  relationships: "bg-pink-100 text-pink-700",
};

function frequencyLabel(n: NominationWithUsers) {
  if (n.frequency === "times_per_week") return `${n.frequency_count}× per week`;
  if (n.frequency === "daily") return "Every day";
  return "Once a week";
}

export default function NominationCard({
  nomination,
}: {
  nomination: NominationWithUsers;
}) {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline") {
    setError(null);
    setIsFetching(true);
    try {
      const res = await fetch(`/api/nominations/${nomination.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          chosen_reason: action === "accept" ? reason || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900">{nomination.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            From <span className="font-medium">{nomination.fromUser.name}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[nomination.category] ?? "bg-gray-100 text-gray-600"}`}
        >
          {nomination.category}
        </span>
      </div>

      {/* Details */}
      <div className="flex gap-3 text-sm text-gray-500">
        <span>{frequencyLabel(nomination)}</span>
        <span>·</span>
        <span>€{Number(nomination.penalty_amount).toFixed(2)} / week</span>
      </div>

      {/* Message */}
      {nomination.message && (
        <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
          "{nomination.message}"
        </p>
      )}

      {/* Accept reason textarea */}
      {showAccept && (
        <div className="flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why did you choose this? (optional)"
            rows={2}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        {showAccept ? (
          <>
            <button
              onClick={() => respond("accept")}
              disabled={isFetching}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isFetching ? "Accepting…" : "Confirm accept"}
            </button>
            <button
              onClick={() => setShowAccept(false)}
              disabled={isFetching}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAccept(true)}
              disabled={isFetching}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => respond("decline")}
              disabled={isFetching}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isFetching ? "Declining…" : "Decline"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
