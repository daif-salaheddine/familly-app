"use client";

import { useActionState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerAction } from "../../app/actions/auth";
import { useTranslations } from "next-intl";

const initialState = { error: null };

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

const labelStyle: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontSize: "13px",
  fontWeight: 700,
  color: "#1a1a2e",
};

export default function RegisterForm() {
  const t = useTranslations("register");
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {/* First name + Last name */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="firstName" style={labelStyle}>{t("firstName")}</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              autoComplete="given-name"
              placeholder={t("firstNamePlaceholder")}
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="lastName" style={labelStyle}>{t("lastName")}</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              placeholder={t("lastNamePlaceholder")}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" style={labelStyle}>{t("email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label htmlFor="password" style={labelStyle}>{t("password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" style={labelStyle}>{t("confirmPassword")}</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>

        {state.error && (
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#e74c3c" }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "15px",
            background: isPending ? "#9b7fd4" : "#6c31e3",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "10px 24px",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? t("signingUp") : t("signUp")}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: "2px", background: "#e5e5e5" }} />
        <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", fontWeight: 700, color: "#aaa" }}>
          {t("orDivider")}
        </span>
        <div style={{ flex: 1, height: "2px", background: "#e5e5e5" }} />
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          background: "#ffffff",
          color: "#1a1a2e",
          border: "2px solid #1a1a2e",
          borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e",
          padding: "10px 24px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <GoogleIcon />
        {t("signUpWithGoogle")}
      </button>

      {/* Sign in link */}
      <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 600, color: "#888", textAlign: "center" }}>
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" style={{ color: "#6c31e3", fontWeight: 800, textDecoration: "none" }}>
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
