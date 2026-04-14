import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=invalid", req.url));
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: { verification_token: tokenHash },
    select: { id: true, email_verified: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?verified=invalid", req.url));
  }

  if (!user.email_verified) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        verification_token: null,
      },
    });
  }

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
