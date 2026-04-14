"use client";

import { useActionState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { loginAction } from "../../app/actions/auth";
import { useTranslations } from "next-intl";
import { playLoginSuccess, playMissGoal } from "../../lib/sounds";

const initialState = { error: null };

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("login");
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  // Track whether an attempt is in flight so we can react to errors
  const attemptedRef = useRef(false);

  // Play fanfare immediately on submit — if login succeeds the page
  // navigates away before isPending settles, so useEffect never fires.
  function handleSubmit() {
    attemptedRef.current = true;
    playLoginSuccess();
  }

  // If the action returns with an error (page stayed), play miss goal
  useEffect(() => {
    if (state.error && attemptedRef.current) {
      playMissGoal();
      attemptedRef.current = false;
    }
  }, [state.error]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Pass callbackUrl through so the server action can redirect there */}
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
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
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          style={{
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
          }}
        />
      </div>

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
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          style={{
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
          }}
        />
      </div>

      {/* Forgot password link */}
      <div style={{ textAlign: "right", marginTop: "-8px" }}>
        <Link
          href="/forgot-password"
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "#6c31e3",
            textDecoration: "none",
          }}
        >
          {t("forgotPassword")}
        </Link>
      </div>

      {state.error && (
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "#e74c3c",
          }}
        >
          {t("invalidCredentials")}
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
          transition: "opacity 0.1s",
        }}
      >
        {isPending ? t("signingIn") : t("signIn")}
      </button>

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
        onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/profile" })}
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
        {t("signInWithGoogle")}
      </button>

      {/* Register link */}
      <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 600, color: "#888", textAlign: "center" }}>
        {t("noAccount")}{" "}
        <Link href="/register" style={{ color: "#6c31e3", fontWeight: 800, textDecoration: "none" }}>
          {t("registerLink")}
        </Link>
      </p>
    </form>
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
