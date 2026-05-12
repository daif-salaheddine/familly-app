"use client";

import { useTranslations } from "next-intl";
import { setLanguage } from "../../actions/setLanguage";

const LANGUAGES = [
  { code: "en" as const, label: "EN" },
  { code: "fr" as const, label: "FR" },
  { code: "ar" as const, label: "العربية" },
];

export default function LanguageSelector({
  current,
}: {
  current: "EN" | "FR" | "AR";
}) {
  const t = useTranslations("profile");
  const currentCode = current.toLowerCase() as "en" | "fr" | "ar";

  return (
    <div className="flex flex-col gap-2">
      <p
        style={{
          fontFamily: "Bangers, cursive",
          fontSize: "14px",
          letterSpacing: "1px",
          color: "#1a1a2e",
          textTransform: "uppercase",
        }}
      >
        {t("language")}
      </p>
      <div className="flex gap-2 flex-wrap">
        {LANGUAGES.map(({ code, label }) => (
          <form key={code} action={setLanguage.bind(null, code)}>
            <button
              type="submit"
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                borderRadius: "100px",
                padding: "6px 16px",
                cursor: "pointer",
                border: "2px solid #1a1a2e",
                boxShadow: currentCode === code ? "2px 2px 0 #1a1a2e" : "none",
                background: currentCode === code ? "#6c31e3" : "#ffffff",
                color: currentCode === code ? "#ffffff" : "#1a1a2e",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              {label}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
