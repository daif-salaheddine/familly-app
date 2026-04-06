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
        <label className="text-sm font-medium text-gray-700">
          {t("photoOrVideo")}
        </label>

        {/* Preview */}
        {previewUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
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
          className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-center"
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
      </div>

      {/* Caption */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          {t("caption")}
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder={t("captionPlaceholder")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!file || isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? t("uploading") : t("submitCheckin")}
      </button>
    </form>
  );
}
