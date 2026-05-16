"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

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

export default function GoogleConnectButton({ connected }: { connected: boolean }) {
  const t = useTranslations("userSettings");

  if (connected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <GoogleIcon />
        <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>
          {t("googleConnected")}
        </span>
        <span style={{
          fontFamily: "Nunito, sans-serif", fontSize: "12px", fontWeight: 700,
          color: "#2ecc71", background: "#e8faf0", border: "1.5px solid #2ecc71",
          borderRadius: "100px", padding: "2px 10px",
        }}>
          ✓ {t("googleLinked")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 600, color: "#888", lineHeight: 1.4 }}>
        {t("googleConnectHint")}
      </p>
      <button
        onClick={() => signIn("google", { callbackUrl: "/settings" })}
        style={{
          fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: "14px",
          background: "#ffffff", color: "#1a1a2e",
          border: "2px solid #1a1a2e", borderRadius: "100px",
          boxShadow: "2px 2px 0 #1a1a2e", padding: "10px 20px",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: "10px",
        }}
      >
        <GoogleIcon />
        {t("googleConnect")}
      </button>
    </div>
  );
}
