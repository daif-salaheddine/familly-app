"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { playGoalCompleted } from "../../lib/sounds";

interface Props {
  goalId: string;
  status: "active" | "paused" | "completed";
}

const btnBase: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontWeight: 800,
  fontSize: "14px",
  borderRadius: "100px",
  padding: "8px 20px",
  cursor: "pointer",
  border: "2px solid #1a1a2e",
  boxShadow: "2px 2px 0 #1a1a2e",
  width: "100%",
};

export default function GoalActions({ goalId, status }: Props) {
  const t = useTranslations("goals");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function patch(newStatus: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
      } else {
        if (newStatus === "completed") playGoalCompleted();
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        setConfirmDelete(false);
      } else {
        window.location.href = "/profile";
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "completed") {
    return (
      <div className="flex flex-col gap-2">
        {confirmDelete ? (
          <ConfirmDeleteBox
            t={t}
            tCommon={tCommon}
            loading={loading}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            style={{ ...btnBase, background: "#e74c3c", color: "#ffffff", opacity: loading ? 0.6 : 1 }}
          >
            {t("deleteGoal")}
          </button>
        )}
        {error && (
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#e74c3c", fontWeight: 700 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "active" && (
        <button
          onClick={() => patch("paused")}
          disabled={loading}
          style={{ ...btnBase, background: "#ffffff", color: "#1a1a2e", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? t("pausing") : t("pauseGoal")}
        </button>
      )}
      {status === "paused" && (
        <button
          onClick={() => patch("active")}
          disabled={loading}
          style={{ ...btnBase, background: "#6c31e3", color: "#ffffff", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? t("resuming") : t("resumeGoal")}
        </button>
      )}
      <button
        onClick={() => patch("completed")}
        disabled={loading}
        style={{ ...btnBase, background: "#2ecc71", color: "#1a1a2e", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? t("completing") : t("completeGoal")}
      </button>

      {confirmDelete ? (
        <ConfirmDeleteBox
          t={t}
          tCommon={tCommon}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
          style={{ ...btnBase, background: "#e74c3c", color: "#ffffff", opacity: loading ? 0.6 : 1 }}
        >
          {t("deleteGoal")}
        </button>
      )}

      {error && (
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#e74c3c", fontWeight: 700 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ConfirmDeleteBox({
  t,
  tCommon,
  loading,
  onConfirm,
  onCancel,
}: {
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        background: "#FFE0E0",
        border: "3px solid #e74c3c",
        borderRadius: "16px",
        boxShadow: "3px 3px 0 #e74c3c",
        padding: "14px",
      }}
    >
      <p
        style={{
          fontFamily: "Nunito, sans-serif",
          fontWeight: 800,
          fontSize: "14px",
          color: "#C0392B",
          marginBottom: "10px",
        }}
      >
        {t("confirmDelete")}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            flex: 1,
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "13px",
            background: "#e74c3c",
            color: "#ffffff",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "7px 12px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? t("deleting") : t("deleteGoal")}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            fontFamily: "Nunito, sans-serif",
            fontWeight: 800,
            fontSize: "13px",
            background: "#ffffff",
            color: "#1a1a2e",
            border: "2px solid #1a1a2e",
            borderRadius: "100px",
            boxShadow: "2px 2px 0 #1a1a2e",
            padding: "7px 12px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {tCommon("cancel")}
        </button>
      </div>
    </div>
  );
}
