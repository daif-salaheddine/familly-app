import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "checkins";

/**
 * Uploads a file buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  buffer: ArrayBuffer,
  contentType: string,
  storagePath: string,
  bucket = BUCKET
): Promise<string> {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Storage upload failed: ${res.status} ${body}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

/** Derives a file extension from a MIME type. */
export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return map[mime] ?? "bin";
}
