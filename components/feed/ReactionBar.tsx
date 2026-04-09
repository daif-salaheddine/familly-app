"use client";

import { useState } from "react";
import type { ReactionData } from "../../lib/feed";

const EMOJIS = ["💪", "🔥", "❤️", "👏"] as const;
type Emoji = (typeof EMOJIS)[number];

function buildCounts(reactions: ReactionData[], currentUserId: string) {
  const counts: Record<Emoji, number> = { "💪": 0, "🔥": 0, "❤️": 0, "👏": 0 };
  const mine = new Set<Emoji>();
  for (const r of reactions) {
    if (r.emoji in counts) {
      counts[r.emoji as Emoji]++;
      if (r.user_id === currentUserId) mine.add(r.emoji as Emoji);
    }
  }
  return { counts, mine };
}

export default function ReactionBar({
  checkinId,
  reactions: initialReactions,
  currentUserId,
}: {
  checkinId: string;
  reactions: ReactionData[];
  currentUserId: string;
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const [pending, setPending] = useState<Emoji | null>(null);

  const { counts, mine } = buildCounts(reactions, currentUserId);

  async function handleToggle(emoji: Emoji) {
    if (pending) return;
    setPending(emoji);

    // Optimistic update
    const alreadyReacted = mine.has(emoji);
    setReactions((prev) => {
      if (alreadyReacted) {
        return prev.filter(
          (r) => !(r.user_id === currentUserId && r.emoji === emoji)
        );
      } else {
        return [
          ...prev,
          { id: `optimistic-${Date.now()}`, user_id: currentUserId, emoji },
        ];
      }
    });

    try {
      const res = await fetch(`/api/checkins/${checkinId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (!res.ok) {
        setReactions(initialReactions);
      } else if (!alreadyReacted) {
        const json = await res.json();
        if (json.data?.reaction) {
          setReactions((prev) =>
            prev.map((r) =>
              r.id.startsWith("optimistic-") && r.emoji === emoji
                ? json.data.reaction
                : r
            )
          );
        }
      }
    } catch {
      setReactions(initialReactions);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {EMOJIS.map((emoji) => {
        const active = mine.has(emoji);
        const count = counts[emoji];
        return (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            disabled={pending !== null}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              background: active ? "#6c31e3" : "#ffffff",
              color: active ? "#ffffff" : "#1a1a2e",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "4px 12px",
              cursor: pending !== null ? "not-allowed" : "pointer",
              opacity: pending !== null ? 0.7 : 1,
              transition: "background 0.1s, color 0.1s",
            }}
          >
            <span style={{ fontSize: "15px", lineHeight: 1 }}>{emoji}</span>
            {count > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 800, tabularNums: true } as React.CSSProperties}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
