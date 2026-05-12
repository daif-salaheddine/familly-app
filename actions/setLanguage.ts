"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "../lib/auth";
import { prisma } from "../lib/db";

type LangCode = "en" | "fr" | "ar";

const DB_MAP: Record<LangCode, "EN" | "FR" | "AR"> = {
  en: "EN",
  fr: "FR",
  ar: "AR",
};

const VALID: LangCode[] = ["en", "fr", "ar"];

export async function setLanguage(lang: LangCode) {
  if (!VALID.includes(lang)) return;

  const user = await getUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { language: DB_MAP[lang] },
  });

  const cookieStore = await cookies();
  cookieStore.set("LOCALE", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/profile");
}
