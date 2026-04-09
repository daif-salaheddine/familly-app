"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ProposalWithVotes } from "../../lib/pot";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(
  d: Date,
  t: ReturnType<typeof useTranslations>
): string {
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return t("closedStatus");
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return t("lessThan1h");
  if (h < 24) return `${h}h ${t("timeLeft")}`;
  return `${Math.floor(h / 24)}d ${t("timeLeft")}`;
}

export default function ProposalCard({
  proposal,
  currentUserId,
}: {
  proposal: ProposalWithVotes;
  currentUserId: string;
}) {
  const t = useTranslations("pot");
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

    const prev = { votesFor, votesAgainst, activeVote };
    if (activeVote === direction) {
      direction === "for"
        ? setVotesFor((n) => n - 1)
        : setVotesAgainst((n) => n - 1);
      setActiveVote(null);
    } else if (activeVote !== null) {
      if (direction === "for") {
        setVotesFor((n) => n + 1);
        setVotesAgainst((n) => n - 1);
      } else {
        setVotesFor((n) => n - 1);
        setVotesAgainst((n) => n + 1);
      }
      setActiveVote(direction);
    } else {
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
  const leading = forPct >= 50;

  // Card style based on status
  const cardStyle: React.CSSProperties =
    proposal.status === "approved"
      ? {
          background: "#E8FFE8",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }
      : proposal.status === "rejected"
        ? {
            background: "#ffe0e0",
            border: "3px solid #e74c3c",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #e74c3c",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }
        : {
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          };

  const badgeBase: React.CSSProperties = {
    border: "2px solid #1a1a2e",
    borderRadius: "100px",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "3px 10px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            color: "#1a1a2e",
            lineHeight: "1.4",
            flex: 1,
          }}
        >
          {proposal.description}
        </p>
        {proposal.status === "approved" && (
          <span style={{ ...badgeBase, background: "#E8FFE8", color: "#1A7A1A" }}>
            {t("approved")}
          </span>
        )}
        {proposal.status === "rejected" && (
          <span style={{ ...badgeBase, background: "#ffe0e0", color: "#C0392B" }}>
            {t("rejected")}
          </span>
        )}
        {proposal.status === "open" && (
          <span
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#888",
              flexShrink: 0,
            }}
          >
            {timeUntil(proposal.closes_at, t)}
          </span>
        )}
      </div>

      {/* Proposer + date */}
      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "#888",
        }}
      >
        {t("proposedBy")}{" "}
        <span style={{ fontWeight: 700, color: "#6c31e3" }}>{proposal.proposer.name}</span>
        {" · "}
        {formatDate(proposal.created_at)}
      </p>

      {/* Vote bar — DESIGN.md progress bar style */}
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div
            style={{
              flex: 1,
              background: "#f1efe8",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              height: "14px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${forPct}%`,
                height: "100%",
                background: leading ? "#2ecc71" : "#e74c3c",
                borderRadius: "100px",
                transition: "width 0.3s",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              fontWeight: 800,
              color: "#1a1a2e",
              whiteSpace: "nowrap",
            }}
          >
            {votesFor}–{votesAgainst}
          </span>
        </div>
      )}

      {error && (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "#e74c3c",
          }}
        >
          {error}
        </p>
      )}

      {/* Vote buttons — only for open proposals */}
      {isOpen && (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote("for")}
            disabled={pending}
            style={{
              flex: 1,
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              background: activeVote === "for" ? "#2ecc71" : "#ffffff",
              color: activeVote === "for" ? "#1a1a2e" : "#1a1a2e",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "8px 12px",
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {t("voteFor")} {t("voteForLabel")}{votesFor > 0 ? ` (${votesFor})` : ""}
          </button>
          <button
            onClick={() => handleVote("against")}
            disabled={pending}
            style={{
              flex: 1,
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              background: activeVote === "against" ? "#e74c3c" : "#ffffff",
              color: activeVote === "against" ? "#ffffff" : "#1a1a2e",
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              boxShadow: "2px 2px 0 #1a1a2e",
              padding: "8px 12px",
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {t("voteAgainst")} {t("voteAgainstLabel")}{votesAgainst > 0 ? ` (${votesAgainst})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
