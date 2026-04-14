"use server";

import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { signIn } from "../../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/db";
import { sendVerificationEmail } from "../../lib/email";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }

  // Redirect to callbackUrl if it's a safe relative path, otherwise /profile
  const raw = formData.get("callbackUrl") as string | null;
  const destination =
    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/profile";
  redirect(destination);
}

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
});

export async function registerAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    return { error: "Passwords don't match" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const password_hash = await bcrypt.hash(password, 12);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
      has_onboarded: false,
      email_verified: false,
      verification_token: tokenHash,
    },
  });

  // Fire-and-forget — don't block registration on email delivery
  sendVerificationEmail(email, name, rawToken).catch((err) =>
    console.error("[registerAction] failed to send verification email:", err)
  );

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in." };
    }
    throw error;
  }

  redirect("/onboarding");
}
