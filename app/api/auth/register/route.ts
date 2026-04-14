import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { data: null, error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const password_hash = await bcrypt.hash(password, 12);

  // Generate a verification token — store only the SHA-256 hash
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
      email_verified: false,
      has_onboarded: false,
      verification_token: tokenHash,
    },
  });

  // Send verification email — fire and forget (don't block registration on email failure)
  sendVerificationEmail(email, name, rawToken).catch((err) =>
    console.error("[register] failed to send verification email:", err)
  );

  return NextResponse.json({ data: { success: true }, error: null });
}
