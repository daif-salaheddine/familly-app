import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { uploadFile, extFromMime } from "../../../../lib/storage";
import { prisma } from "../../../../lib/db";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();

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
        { data: null, error: "Images only (jpeg, png, gif, webp)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { data: null, error: "File exceeds 5 MB limit" },
        { status: 400 }
      );
    }

    const ext = extFromMime(file.type);
    const storagePath = `${user.id}/${Date.now()}.${ext}`;

    const buffer = await file.arrayBuffer();
    const avatarUrl = await uploadFile(buffer, file.type, storagePath, "avatars");

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: avatarUrl },
    });

    return NextResponse.json(
      { data: { avatar_url: avatarUrl }, error: null },
      { status: 200 }
    );
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[upload/avatar]", res);
    return NextResponse.json(
      { data: null, error: "Upload failed" },
      { status: 500 }
    );
  }
}
