import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  digest_enabled: z.boolean().optional(),
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

    const { name, digest_enabled } = parsed.data;

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        ...(name !== undefined && { name }),
        ...(digest_enabled !== undefined && { digest_enabled }),
      },
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
