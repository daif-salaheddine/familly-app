import { NextResponse } from "next/server";
import crypto from "crypto";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true, email_verified: true },
  });

  if (!dbUser) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
  if (dbUser.email_verified) {
    return NextResponse.json({ data: { already_verified: true }, error: null });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: { verification_token: tokenHash },
  });

  sendVerificationEmail(dbUser.email, dbUser.name, rawToken).catch((err) =>
    console.error("[resend-verification]", err)
  );

  return NextResponse.json({ data: { sent: true }, error: null });
}
