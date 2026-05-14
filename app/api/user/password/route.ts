import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getUser();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { password_hash: true },
    });

    if (!dbUser?.password_hash) {
      return NextResponse.json(
        { data: null, error: "No password set for this account" },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password_hash);
    if (!valid) {
      return NextResponse.json(
        { data: null, error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { password_hash: hash },
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
