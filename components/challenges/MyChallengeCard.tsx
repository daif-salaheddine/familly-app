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
  const badgeBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "2px solid #1a1a2e",
    borderRadius: "100px",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "3px 10px",
    whiteSpace: "nowrap",
  };

  if (status === "pending_suggestions") {
    return (
      <span style={{ ...badgeBase, background: "#FFF3E0", color: "#B36200" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f39c12", flexShrink: 0 }} />
        {t("waitingForSuggestions")}
      </span>
    );
  }
  if (status === "pending_choice") {
    return (
      <span style={{ ...badgeBase, background: "#E0E8FF", color: "#2C3E8C" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2C3E8C", flexShrink: 0 }} />
        {t("chooseYourChallenge")}
      </span>
    );
  }
  return (
    <span style={{ ...badgeBase, background: "#E8FFE8", color: "#1A7A1A" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", flexShrink: 0 }} />
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
      {previewUrl && (
        <div
          style={{
            border: "3px solid #1a1a2e",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#000",
          }}
        >
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
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          color: "#888",
          background: "#F1EFE8",
          border: "3px dashed #B4B2A9",
          borderRadius: "12px",
          padding: "20px 16px",
          cursor: "pointer",
          textAlign: "center",
        }}
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
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            color: "#888",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </p>
      )}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder={t("captionPlaceholderProof")}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
          color: "#1a1a2e",
          background: "#ffffff",
          border: "2px solid #1a1a2e",
          borderRadius: "10px",
          padding: "8px 12px",
          outline: "none",
          resize: "none",
          width: "100%",
        }}
      />
      {error && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!file || isPending}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "14px",
          background: !file || isPending ? "#a8e6c4" : "#2ecc71",
          color: "#1a1a2e",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "9px 20px",
          cursor: !file || isPending ? "not-allowed" : "pointer",
          opacity: !file || isPending ? 0.7 : 1,
        }}
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
    <div
      style={{
        background: "#fff3e0",
        border: "3px solid #f39c12",
        borderRadius: "16px",
        boxShadow: "3px 3px 0 #f39c12",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#B36200",
              marginBottom: "4px",
            }}
          >
            {t("myChallenge")}
          </p>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "#1a1a2e",
            }}
          >
            {challenge.goal.title}
          </p>
        </div>
        <StatusBadge status={challenge.status} t={t} />
      </div>

      {/* ── pending_suggestions ── */}
      {challenge.status === "pending_suggestions" && (
        <div className="flex flex-col gap-3">
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              border: "2px solid #f39c12",
              borderRadius: "10px",
              padding: "12px",
            }}
          >
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#B36200",
              }}
            >
              {t("familySuggestionsHint")}
            </p>
          </div>
          {challenge.suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#888",
                }}
              >
                {t("suggestionsSoFar")} ({challenge.suggestions.length})
              </p>
              {challenge.suggestions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: "#ffffff",
                    border: "2px solid #1a1a2e",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1a1a2e",
                    }}
                  >
                    {s.description}
                  </p>
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "4px",
                    }}
                  >
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
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#B36200",
            }}
          >
            {t("pickAction")}
          </p>
          {error && (
            <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>
              {error}
            </p>
          )}
          {pendingSuggestions.length === 0 ? (
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                color: "#888",
              }}
            >
              {t("noSuggestionsYet")}
            </p>
          ) : (
            pendingSuggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3"
                style={{
                  background: "#ffffff",
                  border: "2px solid #1a1a2e",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1a1a2e",
                    }}
                  >
                    {s.description}
                  </p>
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "4px",
                    }}
                  >
                    — {s.fromUser.name}
                  </p>
                </div>
                <button
                  onClick={() => handleChoose(s.id)}
                  disabled={choosing !== null}
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 800,
                    fontSize: "12px",
                    background: "#6c31e3",
                    color: "#ffffff",
                    border: "2px solid #1a1a2e",
                    borderRadius: "100px",
                    boxShadow: "2px 2px 0 #1a1a2e",
                    padding: "6px 14px",
                    cursor: choosing !== null ? "not-allowed" : "pointer",
                    opacity: choosing !== null ? 0.6 : 1,
                    flexShrink: 0,
                  }}
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
          <div
            style={{
              background: "#E8FFE8",
              border: "2px solid #1a1a2e",
              borderRadius: "12px",
              padding: "12px",
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
              {t("yourChallengeAction")}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#1a1a2e",
              }}
            >
              {challenge.chosenSuggestion.description}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "12px",
                color: "#555",
                marginTop: "4px",
              }}
            >
              — {t("suggestedBy")} {challenge.chosenSuggestion.fromUser.name}
            </p>
          </div>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#B36200",
            }}
          >
            {t("uploadProofInstructions")}
          </p>
          <ProofUploadForm challengeId={challenge.id} />
        </div>
      )}
    </div>
  );
}
