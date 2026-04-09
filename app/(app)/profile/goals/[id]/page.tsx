import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/db";
import GoalActions from "../../../../../components/goals/GoalActions";
import { getTranslations } from "next-intl/server";

const CATEGORY_STYLES: Record<string, { background: string; color: string }> = {
  body:          { background: "#FFE0E0", color: "#C0392B" },
  mind:          { background: "#E0E8FF", color: "#2C3E8C" },
  soul:          { background: "#E8FFE8", color: "#1A7A1A" },
  work:          { background: "#FFF3E0", color: "#B36200" },
  relationships: { background: "#FFE8F5", color: "#8C1A5C" },
};

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  active:    { background: "#E8FFE8", color: "#1A7A1A" },
  paused:    { background: "#f1efe8", color: "#888" },
  completed: { background: "#E0E8FF", color: "#2C3E8C" },
};

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [goal, t, tCommon] = await Promise.all([
    prisma.goal.findUnique({
      where: { id },
      include: {
        nominator: { select: { id: true, name: true } },
        checkins: { orderBy: { created_at: "desc" } },
      },
    }),
    getTranslations("goals"),
    getTranslations("common"),
  ]);

  if (!goal) notFound();

  const membership = await prisma.groupMember.findFirst({
    where: { user_id: session.user.id, group_id: goal.group_id },
  });
  if (!membership) notFound();

  const isOwner = goal.user_id === session.user.id;

  const todayStr = new Date().toISOString().slice(0, 10);
  const checkedInToday = goal.checkins.some(
    (c) => new Date(c.checkin_date).toISOString().slice(0, 10) === todayStr
  );

  const categoryLabels: Record<string, string> = {
    body:          t("categoryBody"),
    mind:          t("categoryMind"),
    soul:          t("categorySoul"),
    work:          t("categoryWork"),
    relationships: t("categoryRelationships"),
  };

  const statusLabels: Record<string, string> = {
    active:    t("statusActive"),
    paused:    t("statusPaused"),
    completed: t("statusCompleted"),
  };

  function frequencyLabel(frequency: string, count: number) {
    if (frequency === "daily") return tCommon("everyDay");
    if (frequency === "times_per_week") return `${count}${tCommon("times")} ${tCommon("perWeek")}`;
    return tCommon("onceAWeek");
  }

  const catStyle = CATEGORY_STYLES[goal.category] ?? { background: "#f1efe8", color: "#888" };
  const statusStyle = STATUS_STYLES[goal.status] ?? { background: "#f1efe8", color: "#888" };

  const badgeStyle: React.CSSProperties = {
    border: "2px solid #1a1a2e",
    borderRadius: "100px",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "3px 10px",
    whiteSpace: "nowrap",
  };

  const metaLabelStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#888",
  };

  const metaValueStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    color: "#1a1a2e",
    marginTop: "2px",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/profile"
        style={{
          fontFamily: "Nunito, sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          color: "#6c31e3",
          textDecoration: "none",
        }}
      >
        ← {t("back")}
      </Link>

      {/* Header card */}
      <div
        style={{
          background: "#ffffff",
          border: "3px solid #1a1a2e",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #1a1a2e",
          padding: "20px",
        }}
      >
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "24px",
              letterSpacing: "1px",
              color: "#1a1a2e",
              lineHeight: 1.2,
            }}
          >
            {goal.title}
          </h1>
          <span style={{ ...badgeStyle, ...statusStyle }}>
            {statusLabels[goal.status] ?? goal.status}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p style={metaLabelStyle}>{t("category")}</p>
            <span style={{ ...badgeStyle, ...catStyle, display: "inline-block", marginTop: "4px" }}>
              {categoryLabels[goal.category] ?? goal.category}
            </span>
          </div>
          <div>
            <p style={metaLabelStyle}>{t("slot")}</p>
            <p style={metaValueStyle}>
              {goal.slot === "self"
                ? `1 — ${t("slotSelfShort")}`
                : `2 — ${t("slotNominatedShort")}`}
            </p>
          </div>
          <div>
            <p style={metaLabelStyle}>{t("frequency")}</p>
            <p style={metaValueStyle}>
              {frequencyLabel(goal.frequency, goal.frequency_count)}
            </p>
          </div>
          <div>
            <p style={metaLabelStyle}>{t("penaltyAmount")}</p>
            <p style={metaValueStyle}>€{Number(goal.penalty_amount).toFixed(2)}</p>
          </div>
          {goal.consecutive_misses > 0 && (
            <div className="col-span-2">
              <p style={metaLabelStyle}>{t("consecutiveMisses")}</p>
              <p style={{ ...metaValueStyle, color: "#e74c3c" }}>
                {goal.consecutive_misses}
              </p>
            </div>
          )}
          {goal.nominator && (
            <div className="col-span-2">
              <p style={metaLabelStyle}>{t("nominatedBy")}</p>
              <p style={{ ...metaValueStyle, color: "#6c31e3" }}>{goal.nominator.name}</p>
            </div>
          )}
        </div>

        {/* Actions — only for owner */}
        {isOwner && (
          <div
            style={{
              borderTop: "2px solid #f1efe8",
              marginTop: "16px",
              paddingTop: "16px",
            }}
          >
            <GoalActions goalId={goal.id} status={goal.status} />
          </div>
        )}
      </div>

      {/* Proof gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            style={{
              fontFamily: "Bangers, cursive",
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#1a1a2e",
            }}
          >
            📸 {t("proofGallery")}
          </h2>

          {isOwner && goal.status === "active" && !checkedInToday && (
            <Link
              href={`/profile/goals/${goal.id}/checkin`}
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                background: "#2ecc71",
                color: "#1a1a2e",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                boxShadow: "2px 2px 0 #1a1a2e",
                padding: "6px 14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              + {t("uploadProof")}
            </Link>
          )}

          {isOwner && checkedInToday && (
            <span
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "12px",
                background: "#E8FFE8",
                color: "#1A7A1A",
                border: "2px solid #1a1a2e",
                borderRadius: "100px",
                padding: "4px 12px",
              }}
            >
              {t("thisWeek")} ✓
            </span>
          )}
        </div>

        {goal.checkins.length === 0 ? (
          <div
            style={{
              background: "#F1EFE8",
              border: "3px dashed #B4B2A9",
              borderRadius: "16px",
              padding: "40px 20px",
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
              {t("noCheckins")}
            </p>
            {isOwner && goal.status === "active" && (
              <Link
                href={`/profile/goals/${goal.id}/checkin`}
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  background: "#2ecc71",
                  color: "#1a1a2e",
                  border: "2px solid #1a1a2e",
                  borderRadius: "100px",
                  boxShadow: "2px 2px 0 #1a1a2e",
                  padding: "8px 20px",
                  textDecoration: "none",
                }}
              >
                {t("uploadProof")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {goal.checkins.map((c) => {
              const isVideo = /\.(mp4|mov|webm)$/i.test(c.media_url);
              return (
                <div
                  key={c.id}
                  style={{
                    background: "#ffffff",
                    border: "3px solid #1a1a2e",
                    borderRadius: "16px",
                    boxShadow: "3px 3px 0 #1a1a2e",
                    overflow: "hidden",
                  }}
                >
                  {isVideo ? (
                    <video
                      src={c.media_url}
                      controls
                      className="w-full aspect-square object-cover bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.media_url}
                      alt={c.caption ?? t("checkIn")}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  <div style={{ padding: "10px" }}>
                    {c.caption && (
                      <p
                        style={{
                          fontFamily: "Nunito, sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#1a1a2e",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.caption}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        fontSize: "11px",
                        color: "#888",
                        marginTop: "2px",
                      }}
                    >
                      {new Date(c.checkin_date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}W{c.week_number}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
