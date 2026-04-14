import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const schema = z.object({
  language: z.enum(["EN", "FR", "AR"]),
  // newPassword is optional — email users already have one; OAuth users may add one
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  avatar_url: z.string().url().optional(),
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

    const { language, newPassword, avatar_url } = parsed.data;

    const password_hash = newPassword
      ? await bcrypt.hash(newPassword, 12)
      : undefined;

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        language,
        has_onboarded: true,
        ...(password_hash ? { password_hash } : {}),
        ...(avatar_url ? { avatar_url } : {}),
      },
    });

    // Return whether the user is already in a group so the flow can
    // redirect them to /groups/new if they aren't.
    const groupCount = await prisma.groupMember.count({
      where: { user_id: sessionUser.id },
    });

    return NextResponse.json({
      data: { success: true, hasGroup: groupCount > 0 },
      error: null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[onboard PATCH]", err);
    return NextResponse.json(
      { data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
