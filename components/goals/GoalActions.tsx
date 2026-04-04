"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  goalId: string;
  status: "active" | "paused" | "completed";
}

export default function GoalActions({ goalId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(newStatus: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "completed") return null;

  return (
    <div className="flex flex-col gap-2">
      {status === "active" && (
        <button
          onClick={() => patch("paused")}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Pause goal"}
        </button>
      )}
      {status === "paused" && (
        <button
          onClick={() => patch("active")}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Resume goal"}
        </button>
      )}
      <button
        onClick={() => patch("completed")}
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Mark as completed"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
