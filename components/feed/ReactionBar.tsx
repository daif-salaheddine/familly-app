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
        // Remove the current user's reaction for this emoji
        return prev.filter(
          (r) => !(r.user_id === currentUserId && r.emoji === emoji)
        );
      } else {
        // Add an optimistic reaction
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
        // Roll back on failure
        setReactions(initialReactions);
      } else if (!alreadyReacted) {
        // Replace optimistic entry with real data
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
    <div className="flex gap-1.5 flex-wrap">
      {EMOJIS.map((emoji) => {
        const active = mine.has(emoji);
        const count = counts[emoji];
        return (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            disabled={pending !== null}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors disabled:opacity-60
              ${
                active
                  ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-semibold tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
