"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ChallengeWithDetails } from "../../types";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  t,
}: {
  status: ChallengeWithDetails["status"];
  t: ReturnType<typeof useTranslations>;
}) {
  if (status === "pending_suggestions") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t("waitingForSuggestions")}
      </span>
    );
  }
  if (status === "pending_choice") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        {t("chooseYourChallenge")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      {t("proveIt")}
    </span>
  );
}

// ─── Proof upload form ────────────────────────────────────────────────────────

function ProofUploadForm({ challengeId }: { challengeId: string }) {
  const t = useTranslations("challenges");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError(t("fileTypeError"));
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError(t("fileSizeError"));
      return;
    }
    setError(null);
    setFile(selected);
    setIsVideo(selected.type.startsWith("video/"));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setIsPending(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadJson.error ?? "Upload failed");
        return;
      }

      const completeRes = await fetch(`/api/challenges/${challengeId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof_url: uploadJson.data.url,
          proof_caption: caption || undefined,
        }),
      });
      const completeJson = await completeRes.json();
      if (!completeRes.ok) {
        setError(completeJson.error ?? "Failed to complete challenge");
        return;
      }

      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
          {isVideo ? (
            <video src={previewUrl} controls className="w-full max-h-60 object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="w-full max-h-60 object-contain" />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors text-center"
      >
        {file ? t("changeFile") : t("chooseMedia")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
        onChange={handleFileChange}
        className="hidden"
      />
      {file && (
        <p className="text-xs text-gray-500 truncate">
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </p>
      )}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder={t("captionPlaceholderProof")}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!file || isPending}
        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isPending ? t("uploading") : t("submitProof")}
      </button>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyChallengeCard({
  challenge,
}: {
  challenge: ChallengeWithDetails;
}) {
  const t = useTranslations("challenges");
  const router = useRouter();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChoose(suggestionId: string) {
    setError(null);
    setChoosing(suggestionId);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/choose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion_id: suggestionId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setChoosing(null);
    }
  }

  const pendingSuggestions = challenge.suggestions.filter(
    (s) => s.status === "pending"
  );

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-white p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            {t("myChallenge")}
          </p>
          <p className="font-semibold text-gray-900">{challenge.goal.title}</p>
        </div>
        <StatusBadge status={challenge.status} t={t} />
      </div>

      {/* ── pending_suggestions ── */}
      {challenge.status === "pending_suggestions" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800">
              {t("familySuggestionsHint")}
            </p>
          </div>
          {challenge.suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500">
                {t("suggestionsSoFar")} ({challenge.suggestions.length})
              </p>
              {challenge.suggestions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
                >
                  <p className="text-sm text-gray-800">{s.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    — {s.fromUser.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── pending_choice ── */}
      {challenge.status === "pending_choice" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {t("pickAction")}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {pendingSuggestions.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noSuggestionsYet")}</p>
          ) : (
            pendingSuggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{s.description}</p>
                  <p className="text-xs text-gray-400 mt-1">— {s.fromUser.name}</p>
                </div>
                <button
                  onClick={() => handleChoose(s.id)}
                  disabled={choosing !== null}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {choosing === s.id ? t("choosing") : t("choose")}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── pending_proof ── */}
      {challenge.status === "pending_proof" && challenge.chosenSuggestion && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
              {t("yourChallengeAction")}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {challenge.chosenSuggestion.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              — {t("suggestedBy")} {challenge.chosenSuggestion.fromUser.name}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {t("uploadProofInstructions")}
          </p>
          <ProofUploadForm challengeId={challenge.id} />
        </div>
      )}
    </div>
  );
}
