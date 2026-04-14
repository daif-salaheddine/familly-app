"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a1a2e",
    background: "#ffffff",
    border: "2px solid #1a1a2e",
    borderRadius: "10px",
    padding: "10px 14px",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FFFBF0" }}
    >
      <div className="w-full max-w-sm">
        {/* Title */}
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
          {!sent && (
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
          )}
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
          {sent ? (
            /* Success state */
            <div className="flex flex-col gap-4 text-center">
              <span style={{ fontSize: "48px" }}>📬</span>
              <p
                style={{
                  fontFamily: "Bangers, cursive",
                  fontSize: "22px",
                  letterSpacing: "1px",
                  color: "#1a1a2e",
                }}
              >
                {t("successTitle")}
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
                {t("successBody")}
              </p>
              <Link
                href="/login"
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#6c31e3",
                  textDecoration: "none",
                  marginTop: "8px",
                }}
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1a1a2e",
                  }}
                >
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {error && (
                <p
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#e74c3c",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "15px",
                  background: loading ? "#9b7fd4" : "#6c31e3",
                  color: "#ffffff",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  boxShadow: "2px 2px 0 #1a1a2e",
                  padding: "10px 24px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t("sending") : t("sendLink")}
              </button>

              <Link
                href="/login"
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#888",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {t("backToLogin")}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
