import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";

export default async function VerifyEmailPage() {
  const t = await getTranslations("emailVerification");

  const session = await auth();
  let userEmail: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    userEmail = user?.email ?? null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FFFBF0" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "30px",
              letterSpacing: "2px",
              color: "#1a1a2e",
            }}
          >
            {t("title")}
          </h1>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "28px",
          }}
        >
          <div className="flex flex-col gap-4 text-center">
            <span style={{ fontSize: "48px" }}>📩</span>
            <p
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "22px",
                letterSpacing: "1px",
                color: "#1a1a2e",
              }}
            >
              {t("sentTitle")}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#555",
                lineHeight: 1.6,
              }}
            >
              {t("sentBody")}
            </p>
            {userEmail && (
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#6c31e3",
                  wordBreak: "break-all",
                }}
              >
                {userEmail}
              </p>
            )}
            <Link
              href="/login"
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                color: "#888",
                textDecoration: "none",
                marginTop: "4px",
              }}
            >
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
