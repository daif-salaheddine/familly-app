"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Avatar from "../ui/Avatar";
import { setLanguage } from "../../actions/setLanguage";
import { signOutAction } from "../../app/actions/auth";

const LANGUAGES = [
  { code: "en" as const, label: "EN" },
  { code: "fr" as const, label: "FR" },
  { code: "ar" as const, label: "العربية" },
];

interface Props {
  name: string;
  email: string;
  avatarUrl: string | null | undefined;
  currentLanguage: "EN" | "FR" | "AR";
}

export default function ProfileDropdown({ name, email, avatarUrl, currentLanguage }: Props) {
  const t = useTranslations("common.profileMenu");

  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentCode = currentLanguage.toLowerCase() as "en" | "fr" | "ar";

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowDeleteModal(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    setOpen(false);
    await signOutAction();
  }

  function openDeleteModal() {
    setOpen(false);
    setDeleteInput("");
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        // Account deleted — sign out via server action (clears the session cookie)
        await signOutAction();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setDeleteError(body?.error ?? "Something went wrong. Please try again.");
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "10px 16px",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    color: "#1a1a2e",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "left" as const,
    transition: "background 0.1s",
  };

  const dividerStyle: React.CSSProperties = {
    height: "1px",
    background: "#e5e0d4",
    margin: "4px 0",
  };

  return (
    <>
      {/* Trigger */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Avatar name={name} url={avatarUrl} size="sm" />
          <span
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: "#1a1a2e",
            }}
          >
            {name}
          </span>
          <span style={{ fontSize: "10px", color: "#888", marginTop: "1px" }}>
            {open ? "▲" : "▼"}
          </span>
        </button>

        {/* Dropdown panel */}
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "230px",
            background: "#FFFBF0",
            border: "3px solid #1a1a2e",
            borderRadius: "16px",
            boxShadow: "4px 4px 0 #1a1a2e",
            zIndex: 100,
            overflow: "hidden",
            // Smooth open/close animation
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-8px)",
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.15s ease, transform 0.15s ease",
          }}
        >
          {/* Header — user identity */}
          <div
            style={{
              padding: "14px 16px",
              background: "#6c31e3",
              borderBottom: "2px solid #1a1a2e",
            }}
          >
            <p
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "16px",
                letterSpacing: "1px",
                color: "#ffffff",
                lineHeight: 1.2,
              }}
            >
              {name}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "11px",
                color: "rgba(255,255,255,0.7)",
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email}
            </p>
          </div>

          {/* Navigation items */}
          <nav>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              style={menuItemStyle}
              className="hover:bg-[#f0ebff] block"
            >
              <span>👤</span> {t("viewProfile")}
            </Link>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              style={menuItemStyle}
              className="hover:bg-[#f0ebff] block"
            >
              <span>🔔</span> {t("notifications")}
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              style={menuItemStyle}
              className="hover:bg-[#f0ebff] block"
            >
              <span>⚙️</span> {t("settings")}
            </Link>
            <Link
              href="/stats"
              onClick={() => setOpen(false)}
              style={menuItemStyle}
              className="hover:bg-[#f0ebff] block"
            >
              <span>📊</span> {t("myStats")}
            </Link>
          </nav>

          <div style={dividerStyle} />

          {/* Language switcher */}
          <div style={{ padding: "10px 16px 12px" }}>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#888",
                marginBottom: "8px",
              }}
            >
              🌐 {t("language")}
            </p>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map(({ code, label }) => (
                <form key={code} action={setLanguage.bind(null, code)}>
                  <button
                    type="submit"
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      borderRadius: "100px",
                      padding: "4px 10px",
                      cursor: "pointer",
                      border: "2px solid #1a1a2e",
                      boxShadow: currentCode === code ? "2px 2px 0 #1a1a2e" : "none",
                      background: currentCode === code ? "#6c31e3" : "#ffffff",
                      color: currentCode === code ? "#ffffff" : "#1a1a2e",
                    }}
                  >
                    {label}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ ...menuItemStyle, width: "100%" }}
            className="hover:bg-[#f0ebff]"
          >
            <span>🚪</span> {signingOut ? "…" : t("signOut")}
          </button>

          {/* Delete account */}
          <button
            onClick={openDeleteModal}
            style={{
              ...menuItemStyle,
              width: "100%",
              color: "#c0392b",
              paddingBottom: "14px",
            }}
            className="hover:bg-red-50"
          >
            <span>🗑️</span> {t("deleteAccount")}
          </button>
        </div>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,26,46,0.6)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteModal(false);
          }}
        >
          <div
            style={{
              background: "#FFFBF0",
              border: "3px solid #1a1a2e",
              borderRadius: "20px",
              boxShadow: "5px 5px 0 #1a1a2e",
              padding: "24px",
              width: "100%",
              maxWidth: "380px",
            }}
          >
            <p
              style={{
                fontFamily: "Bangers, cursive",
                fontSize: "22px",
                letterSpacing: "1px",
                color: "#c0392b",
                marginBottom: "12px",
              }}
            >
              🗑️ {t("deleteTitle")}
            </p>
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "14px",
                color: "#555",
                lineHeight: 1.6,
                marginBottom: "20px",
              }}
            >
              {t("deleteWarning")}
            </p>

            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={t("deleteConfirmPlaceholder")}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                border: "2px solid #1a1a2e",
                borderRadius: "10px",
                background: "#fff",
                marginBottom: deleteError ? "8px" : "16px",
                boxSizing: "border-box",
              }}
            />

            {deleteError && (
              <p
                style={{
                  fontFamily: "Nunito, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#c0392b",
                  marginBottom: "12px",
                  lineHeight: 1.4,
                }}
              >
                ⚠️ {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  background: "#ffffff",
                  color: "#1a1a2e",
                  cursor: "pointer",
                  boxShadow: "2px 2px 0 #1a1a2e",
                }}
              >
                {t("deleteCancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "DELETE" || deleting}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  background: deleteInput === "DELETE" && !deleting ? "#c0392b" : "#e0e0e0",
                  color: deleteInput === "DELETE" && !deleting ? "#ffffff" : "#999",
                  cursor: deleteInput === "DELETE" && !deleting ? "pointer" : "default",
                  boxShadow: deleteInput === "DELETE" && !deleting ? "2px 2px 0 #1a1a2e" : "none",
                  transition: "background 0.15s",
                }}
              >
                {deleting ? "…" : t("deleteConfirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
