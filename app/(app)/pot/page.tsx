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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* ── Pot total ── */}
      <div className="rounded-2xl bg-indigo-600 px-6 py-8 text-center shadow-sm">
        <p className="text-sm font-medium text-indigo-200 mb-2">{t("totalInPot")}</p>
        <p className="text-5xl font-bold text-white tabular-nums">
          €{Number(pot.total_amount).toFixed(2)}
        </p>
        <p className="text-xs text-indigo-300 mt-3">
          {penalties.length > 0
            ? `${t("lastPenalty")} ${formatDate(penalties[0].created_at)}`
            : t("noPenalties")}
        </p>
      </div>

      {/* ── Penalty history ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t("recentPenalties")}
        </h2>
        {penalties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">{t("noPenaltiesYet")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {penalties.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">{p.user.name}</span>
                    {" "}{t("missed")}{" "}
                    <span className="font-medium">{p.goal.title}</span>
                  </p>
                  <p className="text-xs text-red-400 mt-0.5">
                    {t("weekOf")} {formatDate(p.period_start)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-red-600">
                  +€{Number(p.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Proposals ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t("proposals")}
        </h2>

        <ProposeForm />

        {openProposals.length > 0 && (
          <div className="flex flex-col gap-3 mt-1">
            <p className="text-xs font-medium text-gray-500">
              {t("open")} ({openProposals.length})
            </p>
            {openProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} currentUserId={userId} />
            ))}
          </div>
        )}

        {closedProposals.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-xs font-medium text-gray-500">
              {t("closed")} ({closedProposals.length})
            </p>
            {closedProposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} currentUserId={userId} />
            ))}
          </div>
        )}

        {proposals.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">{t("noProposals")}</p>
        )}
      </section>
    </div>
  );
}
