"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ResetPasswordForm() {
  const t = useTranslations("resetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error === "invalid_token") {
          setError(t("invalidToken"));
        } else {
          setError(t("errorGeneric"));
        }
        return;
      }
      setDone(true);
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
          {!done && (
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
          {done ? (
            /* Success state */
            <div className="flex flex-col gap-4 text-center">
              <span style={{ fontSize: "48px" }}>🔓</span>
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
                  fontWeight: 800,
                  fontSize: "15px",
                  background: "#6c31e3",
                  color: "#ffffff",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  boxShadow: "2px 2px 0 #1a1a2e",
                  padding: "10px 24px",
                  textDecoration: "none",
                  display: "inline-block",
                  marginTop: "8px",
                }}
              >
                {t("goToLogin")}
              </Link>
            </div>
          ) : !token ? (
            /* Missing token state */
            <div className="flex flex-col gap-4 text-center">
              <span style={{ fontSize: "48px" }}>🔗</span>
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#e74c3c",
                }}
              >
                {t("invalidToken")}
              </p>
              <Link
                href="/forgot-password"
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#6c31e3",
                  textDecoration: "none",
                }}
              >
                {t("requestNew")}
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1a1a2e",
                  }}
                >
                  {t("passwordLabel")}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="confirm"
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1a1a2e",
                  }}
                >
                  {t("confirmLabel")}
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                {loading ? t("submitting") : t("submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
