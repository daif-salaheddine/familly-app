import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("common.profileMenu");

  return (
    <div className="flex flex-col gap-6">
      <div
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "20px",
          boxShadow: "4px 4px 0 #1a1a2e",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "48px", marginBottom: "12px" }}>⚙️</p>
        <h1
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#1a1a2e",
            marginBottom: "8px",
          }}
        >
          {t("settings")}
        </h1>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "15px",
            color: "#888",
            marginBottom: "24px",
          }}
        >
          {t("comingSoon")}
        </p>
        <Link
          href="/profile"
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "14px",
            color: "#6c31e3",
            textDecoration: "none",
          }}
        >
          ← Back to Profile
        </Link>
      </div>
    </div>
  );
}
