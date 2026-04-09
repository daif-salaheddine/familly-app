import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/db";
import { getPot, getProposals } from "../../../lib/pot";
import ProposalCard from "../../../components/pot/ProposalCard";
import ProposeForm from "../../../components/pot/ProposeForm";
import { getTranslations } from "next-intl/server";

export default async function PotPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [membership, t] = await Promise.all([
    prisma.groupMember.findFirst({
      where: { user_id: userId },
      select: { group_id: true },
    }),
    getTranslations("pot"),
  ]);
  if (!membership) redirect("/login");

  const groupId = membership.group_id;

  const [{ pot, penalties }, proposals] = await Promise.all([
    getPot(groupId),
    getProposals(groupId),
  ]);

  const openProposals = proposals.filter((p) => p.status === "open");
  const closedProposals = proposals.filter((p) => p.status !== "open");

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const sectionTitle: React.CSSProperties = {
    fontFamily: "Bangers, cursive",
    fontSize: "18px",
    letterSpacing: "1px",
    color: "#1a1a2e",
    marginBottom: "12px",
  };

  const subLabel: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    color: "#888",
    marginBottom: "8px",
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#1a1a2e",
          }}
        >
          💰 {t("title")}
        </h1>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "#888",
            marginTop: "4px",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      {/* ── Pot total — yellow treasure card ── */}
      <div
        style={{
          background: "#f1c40f",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "13px",
            fontWeight: 800,
            color: "#1a1a2e",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "8px",
          }}
        >
          {t("totalInPot")}
        </p>
        <p
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "52px",
            letterSpacing: "2px",
            color: "#1a1a2e",
            lineHeight: 1,
          }}
        >
          €{Number(pot.total_amount).toFixed(2)}
        </p>
        <p
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(26,26,46,0.6)",
            marginTop: "10px",
          }}
        >
          {penalties.length > 0
            ? `${t("lastPenalty")} ${formatDate(penalties[0].created_at)}`
            : t("noPenalties")}
        </p>
      </div>

      {/* ── Penalty history ── */}
      <section>
        <h2 style={sectionTitle}>💸 {t("recentPenalties")}</h2>
        {penalties.length === 0 ? (
          <div
            style={{
              background: "#F1EFE8",
              border: "3px dashed #B4B2A9",
              borderRadius: "16px",
              padding: "32px 20px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#888",
              }}
            >
              {t("noPenaltiesYet")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {penalties.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#ffe0e0",
                  border: "3px solid #e74c3c",
                  borderRadius: "16px",
                  boxShadow: "3px 3px 0 #e74c3c",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div className="min-w-0">
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#C0392B",
                    }}
                  >
                    <span style={{ fontWeight: 800 }}>{p.user.name}</span>
                    {" "}{t("missed")}{" "}
                    <span style={{ fontWeight: 700 }}>{p.goal.title}</span>
                  </p>
                  <p
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#e74c3c",
                      marginTop: "2px",
                    }}
                  >
                    {t("weekOf")} {formatDate(p.period_start)}
                  </p>
                </div>
                <p
                  style={{
                    fontFamily: "Bangers, cursive",
                    fontSize: "20px",
                    letterSpacing: "1px",
                    color: "#e74c3c",
                    flexShrink: 0,
                  }}
                >
                  +€{Number(p.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Proposals ── */}
      <section className="flex flex-col gap-3">
        <h2 style={{ ...sectionTitle, marginBottom: "0" }}>🗳️ {t("proposals")}</h2>

        <ProposeForm />

        {openProposals.length > 0 && (
          <div className="flex flex-col gap-3">
            <p style={subLabel}>{t("open")} ({openProposals.length})</p>
            {openProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} currentUserId={userId} />
            ))}
          </div>
        )}

        {closedProposals.length > 0 && (
          <div className="flex flex-col gap-3">
            <p style={subLabel}>{t("closed")} ({closedProposals.length})</p>
            {closedProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} currentUserId={userId} />
            ))}
          </div>
        )}

        {proposals.length === 0 && (
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#888",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            {t("noProposals")}
          </p>
        )}
      </section>
    </div>
  );
}
