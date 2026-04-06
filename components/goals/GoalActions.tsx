"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  goalId: string;
  status: "active" | "paused" | "completed";
}

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
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {t("deleteGoal")}
          </button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "active" && (
        <button
          onClick={() => patch("paused")}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? t("pausing") : t("pauseGoal")}
        </button>
      )}
      {status === "paused" && (
        <button
          onClick={() => patch("active")}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? t("resuming") : t("resumeGoal")}
        </button>
      )}
      <button
        onClick={() => patch("completed")}
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
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
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {t("deleteGoal")}
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
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
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
      <p className="text-sm font-medium text-red-700">{t("confirmDelete")}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? t("deleting") : t("deleteGoal")}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </div>
  );
}
