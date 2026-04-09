"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction } from "../../app/actions/auth";
import { useTranslations } from "next-intl";
import { playLoginSuccess, playMissGoal } from "../../lib/sounds";

const initialState = { error: null };

export default function LoginForm() {
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
    </form>
  );
}
