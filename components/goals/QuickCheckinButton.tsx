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
  const [localDone, setLocalDone] = useState(done);

  const effectiveDone = justDone ? localDone : done;
  const isComplete = effectiveDone >= required;
  const isDisabled = isComplete || checkedInToday || loading;

  async function handleCheckin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/goals/${goalId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkin_date: today, count: 1 }),
      });

      if (res.ok) {
        setLocalDone(done + 1);
        setJustDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-1"
      style={{ marginTop: "6px" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Optimistic progress bar — updates instantly on log */}
      {justDone && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: "3px" }}>
            <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "11px", fontWeight: 800, color: isComplete ? "#27ae60" : "#e74c3c" }}>
              {effectiveDone} / {required} this week
            </span>
            {isComplete && <span style={{ fontSize: "11px" }}>✅</span>}
          </div>
          <div style={{ height: "5px", borderRadius: "100px", background: "#e0e0e0", border: "1.5px solid #1a1a2e", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(1, effectiveDone / required) * 100}%`, background: isComplete ? "#27ae60" : "#e74c3c", borderRadius: "100px", transition: "width 0.3s" }} />
          </div>
        </div>
      )}
      <div className="flex gap-2">
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
    </div>
  );
}
