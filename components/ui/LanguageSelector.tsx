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
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {t("language")}
      </p>
      <div className="flex gap-2">
        {LANGUAGES.map(({ code, label }) => (
          <form key={code} action={setLanguage.bind(null, code)}>
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                currentCode === code
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {label}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
