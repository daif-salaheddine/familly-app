"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Avatar from "../ui/Avatar";
import { playPenaltyAdded } from "../../lib/sounds";

interface Member {
  id: string;
  name: string;
  avatar_url: string | null;
  role: "admin" | "member";
  joined_at: string;
}

interface GroupSettingsPanelProps {
  groupId: string;
  initialName: string;
  initialInviteCode: string;
  lastPenaltyRunAt: string | null;
  members: Member[];
  currentUserId: string;
  origin: string;
  isAdmin: boolean;
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "3px solid #1a1a2e",
  borderRadius: "16px",
  boxShadow: "3px 3px 0 #1a1a2e",
  padding: "24px",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "Bangers, cursive",
  fontSize: "18px",
  letterSpacing: "1px",
  color: "#1a1a2e",
  marginBottom: "12px",
};

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
  flex: 1,
};

const pillBtn = (color: string, disabled = false): React.CSSProperties => ({
  fontFamily: "Nunito, sans-serif",
  fontWeight: 800,
  fontSize: "13px",
  background: disabled ? "#ccc" : color,
  color: "#ffffff",
  border: "2px solid #1a1a2e",
  borderRadius: "100px",
  boxShadow: disabled ? "none" : "2px 2px 0 #1a1a2e",
  padding: "7px 16px",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
  whiteSpace: "nowrap" as const,
});

const ghostBtn: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontWeight: 700,
  fontSize: "13px",
  background: "transparent",
  color: "#888",
  border: "none",
  padding: "4px 8px",
  cursor: "pointer",
};

export default function GroupSettingsPanel({
  groupId,
  initialName,
  initialInviteCode,
  lastPenaltyRunAt,
  members,
  currentUserId,
  origin,
  isAdmin,
}: GroupSettingsPanelProps) {
  const t = useTranslations("settings");
  const router = useRouter();

  // ── Group name ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(initialName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  async function saveName() {
    if (!name.trim() || name === initialName) return;
    setNameSaving(true);
    await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNameSaving(false);
    setNameSaved(true);
    setTimeout(() => { setNameSaved(false); router.refresh(); }, 1200);
  }

  // ── Invite link ─────────────────────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const inviteUrl = `${origin}/join/${inviteCode}`;

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    await navigator.share({ title: "Join Family Quest", url: inviteUrl });
  }

  async function regenerateLink() {
    setRegenerating(true);
    setConfirmRegen(false);
    const res = await fetch(`/api/groups/${groupId}/invite`, { method: "POST" });
    const json = await res.json();
    if (json.data?.invite_code) setInviteCode(json.data.invite_code);
    setRegenerating(false);
  }

  // ── Cron monitoring ─────────────────────────────────────────────────────────
  const [runningPenalties, setRunningPenalties] = useState(false);
  const [penaltiesDone, setPenaltiesDone] = useState(false);

  const lastRunDate = lastPenaltyRunAt ? new Date(lastPenaltyRunAt) : null;
  const isStale = !lastRunDate || (Date.now() - lastRunDate.getTime() > 8 * 24 * 60 * 60 * 1000);

  async function runPenalties() {
    setRunningPenalties(true);
    const res = await fetch(`/api/groups/${groupId}/run-penalties`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setRunningPenalties(false);
    setPenaltiesDone(true);
    if ((json.data?.penaltiesCreated ?? 0) > 0) playPenaltyAdded();
    setTimeout(() => { setPenaltiesDone(false); router.refresh(); }, 2000);
  }

  // ── Kick member ─────────────────────────────────────────────────────────────
  const [kickConfirm, setKickConfirm] = useState<string | null>(null);
  const [kicking, setKicking] = useState<string | null>(null);

  async function kickMember(userId: string) {
    setKicking(userId);
    await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
    setKicking(null);
    setKickConfirm(null);
    router.refresh();
  }

  // ── Transfer admin ───────────────────────────────────────────────────────────
  const [transferConfirm, setTransferConfirm] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  async function transferAdmin(newAdminId: string) {
    setTransferring(true);
    await fetch(`/api/groups/${groupId}/transfer-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newAdminId }),
    });
    setTransferring(false);
    setTransferConfirm(null);
    router.refresh();
  }

  // ── Delete group ─────────────────────────────────────────────────────────────
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteGroup() {
    if (deleteInput !== name || deleting) return;
    setDeleting(true);
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/groups/new");
    } else {
      const json = await res.json();
      setDeleteError(json.error ?? "Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Group name ──────────────────────────────────────────────────────── */}
      {isAdmin ? (
        <div style={cardStyle}>
          <p style={sectionTitle}>{t("groupNameLabel")}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSaved(false); }}
              maxLength={50}
              style={inputStyle}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
            />
            <button
              onClick={saveName}
              disabled={nameSaving || !name.trim()}
              style={pillBtn(nameSaved ? "#22c55e" : "#6c31e3", nameSaving || !name.trim())}
            >
              {nameSaving ? t("saving") : nameSaved ? `✓ ${t("saved")}` : t("save")}
            </button>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={sectionTitle}>{t("groupNameLabel")}</p>
          <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e" }}>
            {name}
          </p>
        </div>
      )}

      {/* ── Invite link ─────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={sectionTitle}>{t("inviteLink")}</p>
        <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#888", marginBottom: "12px" }}>
          {t("inviteLinkHint")}
        </p>

        <div
          style={{
            background: "#f8f8f8",
            border: "2px solid #e5e5e5",
            borderRadius: "10px",
            padding: "10px 14px",
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "#555",
            wordBreak: "break-all",
            marginBottom: "12px",
          }}
        >
          {inviteUrl}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={copyLink} style={pillBtn(copied ? "#22c55e" : "#6c31e3")}>
            {copied ? `✓ ${t("copied")}` : t("copyLink")}
          </button>

          {typeof navigator !== "undefined" && !!navigator.share && (
            <button onClick={shareLink} style={pillBtn("#0ea5e9")}>
              {t("share")}
            </button>
          )}

          {isAdmin && (
            confirmRegen ? (
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "#e74c3c", fontWeight: 700 }}>
                  {t("regenerateWarning")}
                </span>
                <button
                  onClick={regenerateLink}
                  disabled={regenerating}
                  style={pillBtn("#e74c3c", regenerating)}
                >
                  {regenerating ? t("regenerating") : t("confirm")}
                </button>
                <button onClick={() => setConfirmRegen(false)} style={ghostBtn}>
                  {t("cancel")}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmRegen(true)} style={pillBtn("#888")}>
                {t("regenerate")}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Cron monitoring (admin only) ─────────────────────────────────────── */}
      {isAdmin && (
        <div
          style={{
            ...cardStyle,
            ...(isStale ? { border: "3px solid #e74c3c", background: "#fff5f5" } : {}),
          }}
        >
          <p style={sectionTitle}>⏱️ {t("cronStatus")}</p>

          {isStale && (
            <div
              style={{
                background: "#ffe0e0",
                border: "2px solid #e74c3c",
                borderRadius: "10px",
                padding: "10px 14px",
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#c0392b",
                marginBottom: "12px",
              }}
            >
              ⚠️ {lastRunDate ? t("cronStale") : t("cronNeverRun")}
            </div>
          )}

          {lastRunDate && (
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#555",
                marginBottom: "12px",
              }}
            >
              {t("cronLastRun")} {lastRunDate.toLocaleString()}
            </p>
          )}

          <button
            onClick={runPenalties}
            disabled={runningPenalties || penaltiesDone}
            style={pillBtn(penaltiesDone ? "#22c55e" : "#6c31e3", runningPenalties || penaltiesDone)}
          >
            {penaltiesDone ? `✓ ${t("penaltiesRan")}` : runningPenalties ? t("runningPenalties") : t("runPenalties")}
          </button>
        </div>
      )}

      {/* ── Members ─────────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={sectionTitle}>{t("members")}</p>
        <div className="flex flex-col gap-4">
          {members.map((member) => {
            const isSelf = member.id === currentUserId;
            const memberIsAdmin = member.role === "admin";
            const joinedDate = new Date(member.joined_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div key={member.id} className="flex items-start gap-3">
                <Avatar name={member.name} url={member.avatar_url} size="sm" />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "Nunito, sans-serif", fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>
                      {member.name}{isSelf ? ` ${t("youLabel")}` : ""}
                    </span>

                    <span
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        fontSize: "11px",
                        fontWeight: 800,
                        background: memberIsAdmin ? "#f0ebff" : "#f0f0f0",
                        color: memberIsAdmin ? "#6c31e3" : "#888",
                        border: `2px solid ${memberIsAdmin ? "#6c31e3" : "#ddd"}`,
                        borderRadius: "100px",
                        padding: "2px 10px",
                      }}
                    >
                      {memberIsAdmin ? t("roleAdmin") : t("roleMember")}
                    </span>
                  </div>

                  <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "12px", color: "#aaa", fontWeight: 600, marginTop: "2px" }}>
                    {t("joinedDate", { date: joinedDate })}
                  </p>

                  {/* Admin actions — only for non-self, non-admin members */}
                  {isAdmin && !isSelf && !memberIsAdmin && (
                    <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: "6px" }}>
                      {kickConfirm === member.id ? (
                        <>
                          <button
                            onClick={() => kickMember(member.id)}
                            disabled={kicking === member.id}
                            style={pillBtn("#e74c3c", kicking === member.id)}
                          >
                            {kicking === member.id ? t("kicking") : t("confirm")}
                          </button>
                          <button onClick={() => setKickConfirm(null)} style={ghostBtn}>
                            {t("cancel")}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setKickConfirm(member.id); setTransferConfirm(null); }} style={pillBtn("#e74c3c")}>
                          {t("kick")}
                        </button>
                      )}

                      {transferConfirm === member.id ? (
                        <>
                          <button
                            onClick={() => transferAdmin(member.id)}
                            disabled={transferring}
                            style={pillBtn("#f59e0b", transferring)}
                          >
                            {transferring ? t("transferring") : t("confirm")}
                          </button>
                          <button onClick={() => setTransferConfirm(null)} style={ghostBtn}>
                            {t("cancel")}
                          </button>
                        </>
                      ) : (
                        kickConfirm !== member.id && (
                          <button onClick={() => { setTransferConfirm(member.id); setKickConfirm(null); }} style={pillBtn("#f59e0b")}>
                            {t("makeAdmin")}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Danger zone (admin only) ─────────────────────────────────────────── */}
      {isAdmin && (
        <div
          style={{
            background: "#fff5f5",
            border: "3px solid #e74c3c",
            borderRadius: "16px",
            boxShadow: "3px 3px 0 #1a1a2e",
            padding: "24px",
          }}
        >
          <p
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#e74c3c",
              marginBottom: "8px",
            }}
          >
            ⚠️ {t("dangerZone")}
          </p>

          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#c0392b",
              lineHeight: 1.5,
              marginBottom: "16px",
            }}
          >
            {t("deleteGroupWarning")}
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null); }}
              placeholder={t("deleteGroupPlaceholder")}
              style={{
                ...inputStyle,
                border: "2px solid #e74c3c",
              }}
            />

            {deleteError && (
              <p style={{ fontFamily: "Nunito, sans-serif", fontSize: "13px", color: "#e74c3c", fontWeight: 700 }}>
                {deleteError}
              </p>
            )}

            <button
              onClick={deleteGroup}
              disabled={deleteInput !== name || deleting}
              style={pillBtn("#e74c3c", deleteInput !== name || deleting)}
            >
              {deleting ? t("deleting") : t("deleteGroupButton")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
