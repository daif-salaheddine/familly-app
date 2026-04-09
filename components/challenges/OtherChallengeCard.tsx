import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ChallengeWithDetails } from "../../types";

function StatusBadge({
  status,
  labels,
}: {
  status: ChallengeWithDetails["status"];
  labels: { waiting: string; choosing: string; proving: string };
}) {
  const badgeBase: React.CSSProperties = {
    border: "2px solid #1a1a2e",
    borderRadius: "100px",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 800,
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "3px 10px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  if (status === "pending_suggestions") {
    return (
      <span style={{ ...badgeBase, background: "#FFF3E0", color: "#B36200" }}>
        {labels.waiting}
      </span>
    );
  }
  if (status === "pending_choice") {
    return (
      <span style={{ ...badgeBase, background: "#E0E8FF", color: "#2C3E8C" }}>
        {labels.choosing}
      </span>
    );
  }
  return (
    <span style={{ ...badgeBase, background: "#E8FFE8", color: "#1A7A1A" }}>
      {labels.proving}
    </span>
  );
}

export default async function OtherChallengeCard({
  challenge,
  currentUserId,
}: {
  challenge: ChallengeWithDetails;
  currentUserId: string;
}) {
  const t = await getTranslations("challenges");

  const alreadySuggested = challenge.suggestions.some(
    (s) => s.from_user_id === currentUserId
  );
  const canSuggest =
    !alreadySuggested &&
    (challenge.status === "pending_suggestions" ||
      challenge.status === "pending_choice");

  const count = challenge.suggestions.length;
  const suggestionCountLabel =
    count === 0
      ? t("noSuggestionsCount")
      : `${count} ${count === 1 ? t("suggestionSingular") : t("suggestionPlural")}`;

  return (
    <div
      style={{
        background: "#fff3e0",
        border: "3px solid #f39c12",
        borderRadius: "16px",
        boxShadow: "3px 3px 0 #f39c12",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "#1a1a2e",
            }}
          >
            {challenge.user.name}
          </p>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "12px",
              color: "#888",
              marginTop: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {t("goalLabel")} {challenge.goal.title}
          </p>
        </div>
        <StatusBadge
          status={challenge.status}
          labels={{
            waiting:  t("waitingForSuggestions"),
            choosing: t("choosingAction"),
            proving:  t("provingIt"),
          }}
        />
      </div>

      {/* Suggestion count */}
      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          color: "#888",
        }}
      >
        {suggestionCountLabel}
      </p>

      {/* pending_proof: show chosen action */}
      {challenge.status === "pending_proof" && challenge.chosenSuggestion && (
        <div
          style={{
            background: "#E8FFE8",
            border: "2px solid #1a1a2e",
            borderRadius: "10px",
            padding: "10px 12px",
          }}
        >
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#1A7A1A",
              marginBottom: "4px",
            }}
          >
            {t("chosenAction")}
          </p>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1a1a2e",
            }}
          >
            {challenge.chosenSuggestion.description}
          </p>
        </div>
      )}

      {/* Action */}
      {canSuggest ? (
        <Link
          href={`/challenges/${challenge.user_id}/suggest`}
          style={{
            display: "block",
            width: "100%",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "14px",
            background: "#6c31e3",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "9px 20px",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          {t("suggest")}
        </Link>
      ) : alreadySuggested ? (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "#888",
            textAlign: "center",
          }}
        >
          {t("alreadySuggested")}
        </p>
      ) : null}
    </div>
  );
}
