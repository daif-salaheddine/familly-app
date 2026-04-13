import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/db";

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

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
      email_verified: false,
      has_onboarded: false,
    },
  });

  return NextResponse.json({ data: { success: true }, error: null });
}
