"use client";

import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

// ── Canvas crop helper ────────────────────────────────────────────────────────

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.92
    );
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AvatarUpload({
  name,
  initialUrl,
  onUpload,
}: {
  name: string;
  initialUrl: string | null;
  onUpload?: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);

  // Crop modal state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // File selected → read as data URL → open modal
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected after cancel
    e.target.value = "";
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function handleCancel() {
    setImageSrc(null);
  }

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const json = await res.json();

      if (json.data?.avatar_url) {
        setUrl(json.data.avatar_url);
        setImageSrc(null);
        onUpload?.(json.data.avatar_url);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Avatar display — click to open file picker */}
      <div
        className="relative cursor-pointer group"
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
            {name[0]}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">Change</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Crop modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Cropper area */}
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="bg-black px-6 py-5 flex flex-col gap-4">
            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <span className="text-white text-xs w-6 text-center">−</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-white text-xs w-6 text-center">+</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 rounded-lg border border-gray-600 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
