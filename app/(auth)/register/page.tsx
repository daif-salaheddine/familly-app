import { getTranslations } from "next-intl/server";
import RegisterForm from "../../../components/auth/RegisterForm";

export const metadata = {
  title: "Create account — Family Quest",
};

export default async function RegisterPage() {
  const t = await getTranslations("register");

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

        <div
          style={{
            background: "#ffffff",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "28px",
          }}
        >
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
