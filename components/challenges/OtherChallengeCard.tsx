import Link from "next/link";
import type { ChallengeWithDetails } from "../../types";

function StatusBadge({ status }: { status: ChallengeWithDetails["status"] }) {
  if (status === "pending_suggestions") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Waiting for suggestions
      </span>
    );
  }
  if (status === "pending_choice") {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        Choosing action
      </span>
    );
  }
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Proving it
    </span>
  );
}

export default function OtherChallengeCard({
  challenge,
  currentUserId,
}: {
  challenge: ChallengeWithDetails;
  currentUserId: string;
}) {
  const alreadySuggested = challenge.suggestions.some(
    (s) => s.from_user_id === currentUserId
  );
  const canSuggest =
    !alreadySuggested &&
    (challenge.status === "pending_suggestions" ||
      challenge.status === "pending_choice");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900">{challenge.user.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Goal: {challenge.goal.title}
          </p>
        </div>
        <StatusBadge status={challenge.status} />
      </div>

      {/* Suggestion count */}
      <p className="text-xs text-gray-400">
        {challenge.suggestions.length === 0
          ? "No suggestions yet"
          : `${challenge.suggestions.length} suggestion${challenge.suggestions.length === 1 ? "" : "s"}`}
      </p>

      {/* pending_proof: show chosen action */}
      {challenge.status === "pending_proof" && challenge.chosenSuggestion && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-xs font-medium text-green-700 mb-0.5">
            Chosen action
          </p>
          <p className="text-sm text-gray-800">
            {challenge.chosenSuggestion.description}
          </p>
        </div>
      )}

      {/* Action */}
      {canSuggest ? (
        <Link
          href={`/challenges/${challenge.user_id}/suggest`}
          className="block w-full rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Suggest a challenge action
        </Link>
      ) : alreadySuggested ? (
        <p className="text-center text-xs text-gray-400">
          You already submitted a suggestion
        </p>
      ) : null}
    </div>
  );
}
