import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const schema = z.object({
  language: z.enum(["EN", "FR", "AR"]),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function PATCH(req: NextRequest) {
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

    const { language, newPassword } = parsed.data;
    const password_hash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        language,
        password_hash,
        has_onboarded: true,
      },
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[onboard PATCH]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
