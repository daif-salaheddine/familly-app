import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { uploadFile, extFromMime } from "../../../lib/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    await getUser();

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { data: null, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { data: null, error: "File type not allowed. Use images or video." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { data: null, error: "File exceeds 50 MB limit" },
        { status: 400 }
      );
    }

    const ext = extFromMime(file.type);
    const randomId = crypto.randomUUID().slice(0, 8);
    const date = new Date().toISOString().slice(0, 10);
    const storagePath = `uploads/${date}-${randomId}.${ext}`;

    const buffer = await file.arrayBuffer();
    const url = await uploadFile(buffer, file.type, storagePath);

    return NextResponse.json({ data: { url }, error: null }, { status: 201 });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[upload]", res);
    return NextResponse.json(
      { data: null, error: "Upload failed" },
      { status: 500 }
    );
  }
}
