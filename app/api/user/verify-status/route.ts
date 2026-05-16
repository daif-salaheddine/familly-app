import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email_verified: true },
  });

  return NextResponse.json({ data: { email_verified: dbUser?.email_verified ?? false }, error: null });
}
