"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export default function CheckinForm({ goalId }: { goalId: string }) {
  const t = useTranslations("goals");
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
      // 1. Upload file
      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadJson.error ?? "Upload failed");
        return;
      }

      const mediaUrl: string = uploadJson.data.url;
      const today = new Date().toISOString().slice(0, 10);

      // 2. Create checkin record
      const checkinRes = await fetch(`/api/goals/${goalId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_url: mediaUrl,
          caption: caption || undefined,
          checkin_date: today,
        }),
      });
      const checkinJson = await checkinRes.json();
      if (!checkinRes.ok) {
        setError(checkinJson.error ?? t("submitting"));
        return;
      }

      router.push(`/profile/goals/${goalId}`);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* File picker */}
      <div className="flex flex-col gap-2">
        <label
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {t("photoOrVideo")}
        </label>

        {/* Preview */}
        {previewUrl && (
          <div
            style={{
              border: "3px solid #1a1a2e",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#000",
            }}
          >
            {isVideo ? (
              <video
                src={previewUrl}
                controls
                className="w-full max-h-72 object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-72 object-contain"
              />
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
            borderRadius: "16px",
            padding: "28px 16px",
            cursor: "pointer",
            textAlign: "center",
            transition: "opacity 0.15s",
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
      </div>

      {/* Caption */}
      <div className="flex flex-col gap-1">
        <label
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {t("caption")}
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder={t("captionPlaceholder")}
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
      </div>

      {error && (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#e74c3c",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || isPending}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          background: !file || isPending ? "#a8e6c4" : "#2ecc71",
          color: "#1a1a2e",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "10px 24px",
          cursor: !file || isPending ? "not-allowed" : "pointer",
          opacity: !file || isPending ? 0.7 : 1,
        }}
      >
        {isPending ? t("uploading") : t("submitCheckin")}
      </button>
    </form>
  );
}
