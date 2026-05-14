"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOutAction } from "../../app/actions/auth";

export default function DeleteAccountSection() {
  const t = useTranslations("common.profileMenu");

  const [showModal, setShowModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setDeleteInput("");
    setError(null);
    setShowModal(true);
  }

  async function handleDelete() {
    if (deleteInput !== t("deleteConfirmWord") || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        await signOutAction();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#888", marginBottom: "16px", lineHeight: 1.5 }}>
        {t("deleteWarning")}
      </p>
      <button
        onClick={openModal}
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "14px",
          padding: "10px 20px",
          borderRadius: "100px",
          border: "2px solid #c0392b",
          boxShadow: "2px 2px 0 #c0392b",
          background: "#ffffff",
          color: "#c0392b",
          cursor: "pointer",
        }}
      >
        🗑️ {t("deleteAccount")}
      </button>

      {showModal && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
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
            <p style={{ fontFamily: "Bangers, cursive", fontSize: "22px", letterSpacing: "1px", color: "#c0392b", marginBottom: "12px" }}>
              🗑️ {t("deleteTitle")}
            </p>
            <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "14px", color: "#555", lineHeight: 1.6, marginBottom: "20px" }}>
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
                marginBottom: error ? "8px" : "16px",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 700, color: "#c0392b", marginBottom: "12px", lineHeight: 1.4 }}>
                ⚠️ {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
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
                onClick={handleDelete}
                disabled={deleteInput !== t("deleteConfirmWord") || deleting}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  background: deleteInput === t("deleteConfirmWord") && !deleting ? "#c0392b" : "#e0e0e0",
                  color: deleteInput === t("deleteConfirmWord") && !deleting ? "#ffffff" : "#999",
                  cursor: deleteInput === t("deleteConfirmWord") && !deleting ? "pointer" : "default",
                  boxShadow: deleteInput === t("deleteConfirmWord") && !deleting ? "2px 2px 0 #1a1a2e" : "none",
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
