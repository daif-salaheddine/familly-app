import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";

const schema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { newEmail } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ data: null, error: "This email is already in use." }, { status: 409 });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: newEmail,
      email_verified: false,
      verification_token: tokenHash,
    },
    select: { name: true },
  });

  sendVerificationEmail(newEmail, updated.name, rawToken).catch((err) =>
    console.error("[change-email]", err)
  );

  return NextResponse.json({ data: { email: newEmail }, error: null });
}
