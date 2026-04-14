"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  goalId: string;
  done: number;
  required: number;
  checkedInToday: boolean;
}

export default function QuickCheckinButton({ goalId, done, required, checkedInToday }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [justDone, setJustDone] = useState(false);

  const isComplete = done >= required;
  const isDisabled = isComplete || checkedInToday || loading;

  async function handleCheckin(e: React.MouseEvent) {
    e.preventDefault(); // don't navigate if wrapped in a link area
    e.stopPropagation();
    if (isDisabled) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/goals/${goalId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkin_date: today }),
      });

      if (res.ok) {
        setJustDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex gap-2"
      style={{ marginTop: "6px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleCheckin}
        disabled={isDisabled}
        style={{
          flex: 1,
          padding: "8px 0",
          background: isDisabled ? "#e0e0e0" : justDone ? "#27ae60" : "#6c31e3",
          border: `2px solid ${isDisabled ? "#b0b0b0" : "#1a1a2e"}`,
          borderRadius: "100px",
          boxShadow: isDisabled ? "none" : "2px 2px 0 #1a1a2e",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "12px",
          color: isDisabled ? "#999" : "#ffffff",
          cursor: isDisabled ? "default" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "..." : isComplete ? "✅ Done" : checkedInToday ? "✓ Logged" : justDone ? "✓ Done!" : "✓ Log it"}
      </button>

      {!isComplete && (
        <Link
          href={`/profile/goals/${goalId}/checkin`}
          style={{
            padding: "8px 12px",
            background: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "12px",
            color: "#1a1a2e",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          📷
        </Link>
      )}
    </div>
  );
}
