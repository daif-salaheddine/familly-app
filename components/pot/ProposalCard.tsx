"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProposalWithVotes } from "../../lib/pot";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(d: Date) {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "< 1h left";
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

export default function ProposalCard({
  proposal,
  currentUserId,
}: {
  proposal: ProposalWithVotes;
  currentUserId: string;
}) {
  const router = useRouter();

  const myVote = proposal.votes.find((v) => v.user_id === currentUserId)?.vote ?? null;

  const [votesFor, setVotesFor] = useState(proposal.votes_for);
  const [votesAgainst, setVotesAgainst] = useState(proposal.votes_against);
  const [activeVote, setActiveVote] = useState<"for" | "against" | null>(
    myVote as "for" | "against" | null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = proposal.status === "open";

  async function handleVote(direction: "for" | "against") {
    if (pending || !isOpen) return;
    setError(null);
    setPending(true);

    // Optimistic update
    const prev = { votesFor, votesAgainst, activeVote };
    if (activeVote === direction) {
      // Toggle off
      direction === "for"
        ? setVotesFor((n) => n - 1)
        : setVotesAgainst((n) => n - 1);
      setActiveVote(null);
    } else if (activeVote !== null) {
      // Switch
      if (direction === "for") {
        setVotesFor((n) => n + 1);
        setVotesAgainst((n) => n - 1);
      } else {
        setVotesFor((n) => n - 1);
        setVotesAgainst((n) => n + 1);
      }
      setActiveVote(direction);
    } else {
      // New vote
      direction === "for"
        ? setVotesFor((n) => n + 1)
        : setVotesAgainst((n) => n + 1);
      setActiveVote(direction);
    }

    try {
      const res = await fetch(`/api/pot/proposals/${proposal.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: direction }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Roll back
        setVotesFor(prev.votesFor);
        setVotesAgainst(prev.votesAgainst);
        setActiveVote(prev.activeVote);
        setError(json.error ?? "Something went wrong");
      } else {
        router.refresh();
      }
    } catch {
      setVotesFor(prev.votesFor);
      setVotesAgainst(prev.votesAgainst);
      setActiveVote(prev.activeVote);
      setError("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const total = votesFor + votesAgainst;
  const forPct = total > 0 ? Math.round((votesFor / total) * 100) : 50;

  return (
    <div
      className={`rounded-xl border bg-white p-4 flex flex-col gap-3 ${
        proposal.status === "approved"
          ? "border-green-200 bg-green-50"
          : proposal.status === "rejected"
            ? "border-red-200 bg-red-50"
            : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900 text-sm leading-snug flex-1">
          {proposal.description}
        </p>
        {proposal.status === "approved" && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Approved
          </span>
        )}
        {proposal.status === "rejected" && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            Rejected
          </span>
        )}
        {proposal.status === "open" && (
          <span className="shrink-0 text-xs text-gray-400">
            {timeUntil(proposal.closes_at)}
          </span>
        )}
      </div>

      {/* Proposer + date */}
      <p className="text-xs text-gray-400">
        Proposed by{" "}
        <span className="font-medium text-gray-600">{proposal.proposer.name}</span>
        {" · "}
        {formatDate(proposal.created_at)}
      </p>

      {/* Vote bar */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${forPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums">
            {votesFor}–{votesAgainst}
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Vote buttons — only shown for open proposals */}
      {isOpen && (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote("for")}
            disabled={pending}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              activeVote === "for"
                ? "bg-indigo-600 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            👍 For{votesFor > 0 ? ` (${votesFor})` : ""}
          </button>
          <button
            onClick={() => handleVote("against")}
            disabled={pending}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              activeVote === "against"
                ? "bg-red-500 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            👎 Against{votesAgainst > 0 ? ` (${votesAgainst})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
