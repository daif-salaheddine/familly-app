import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../../../../lib/db";
import { sendPasswordReset } from "../../../../lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      // Always return 200 to prevent user enumeration
      return NextResponse.json({ data: { sent: true }, error: null });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // If user doesn't exist, still return 200 (silent no-op)
    if (user) {
      // Generate a cryptographically secure random token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Store the SHA-256 hash in the DB — never the raw token
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_token: tokenHash,
          reset_expires_at: expiresAt,
        },
      });

      // Send email with the RAW token (the only place it ever travels)
      await sendPasswordReset(user.email, user.name, rawToken);
    }

    return NextResponse.json({ data: { sent: true }, error: null });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
