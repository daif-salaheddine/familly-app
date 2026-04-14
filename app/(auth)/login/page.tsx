import { getTranslations } from "next-intl/server";
import LoginForm from "../../../components/auth/LoginForm";

export const metadata = {
  title: "Sign in — Family App",
};

interface Props {
  searchParams: Promise<{ callbackUrl?: string; verified?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const t = await getTranslations("login");
  const tVerify = await getTranslations("emailVerification");
  const { callbackUrl, verified } = await searchParams;

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
              fontSize: "36px",
              letterSpacing: "2px",
              color: "#1a1a2e",
            }}
          >
            {t("title")}
          </h1>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#888",
              marginTop: "6px",
            }}
          >
            {t("subtitle")}
          </p>
        </div>

        {verified === "1" && (
          <div
            style={{
              background: "#d1fae5",
              border: "2px solid #059669",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#065f46",
              textAlign: "center",
            }}
          >
            {tVerify("successBanner")}
          </div>
        )}

        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "28px",
          }}
        >
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
