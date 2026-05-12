import { getTranslations } from "next-intl/server";
import type { FeedItem as FeedItemType, ReactionData } from "../../lib/feed";
import ReactionBar from "./ReactionBar";
import Avatar from "../ui/Avatar";

const CATEGORY_STYLES: Record<string, { background: string; color: string }> = {
  body:          { background: "#FFE0E0", color: "#C0392B" },
  mind:          { background: "#E0E8FF", color: "#2C3E8C" },
  soul:          { background: "#E8FFE8", color: "#1A7A1A" },
  work:          { background: "#FFF3E0", color: "#B36200" },
  relationships: { background: "#FFE8F5", color: "#8C1A5C" },
};

function timeAgo(date: Date, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t("minutesAgo")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t("hoursAgo")}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${t("daysAgo")}`;
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

const comicCard: React.CSSProperties = {
  background: "#ffffff",
  border: "3px solid #1a1a2e",
  borderRadius: "16px",
  boxShadow: "3px 3px 0 #1a1a2e",
  overflow: "hidden",
};

const nameStyle: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontWeight: 700,
  fontSize: "14px",
  color: "#1a1a2e",
};

const mutedStyle: React.CSSProperties = {
  fontFamily: "Nunito, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  color: "#888",
};

export default async function FeedItem({
  item,
  currentUserId,
}: {
  item: FeedItemType;
  currentUserId: string;
}) {
  const t = await getTranslations("feed");

  const ts = (
    <span style={mutedStyle}>{timeAgo(item.created_at, t)}</span>
  );

  // ── Checkin ──────────────────────────────────────────────────────────────
  if (item.type === "checkin") {
    const { data } = item;
    const video = data.media_url ? isVideo(data.media_url) : false;
    return (
      <div style={comicCard}>
        {/* Media */}
        {data.media_url && (
          <div style={{ background: "#000" }}>
            {video ? (
              <video
                src={data.media_url}
                controls
                playsInline
                className="w-full max-h-80 object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.media_url}
                alt={t("checkinAlt")}
                className="w-full max-h-80 object-contain"
              />
            )}
          </div>
        )}

        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
              <div>
                <p style={nameStyle}>{data.user.name}</p>
                <p style={{ ...mutedStyle, marginTop: "1px" }}>{data.goal.title}</p>
              </div>
            </div>
            {ts}
          </div>

          {/* Caption */}
          {data.caption && (
            <p
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1a1a2e",
              }}
            >
              {data.caption}
            </p>
          )}

          {/* Reactions */}
          <ReactionBar
            checkinId={data.id}
            reactions={data.reactions as ReactionData[]}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    );
  }

  // ── Goal created ─────────────────────────────────────────────────────────
  if (item.type === "goal") {
    const { data } = item;
    const catStyle = CATEGORY_STYLES[data.category] ?? { background: "#f1efe8", color: "#888" };
    return (
      <div
        style={{
          ...comicCard,
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#555",
              minWidth: 0,
            }}
          >
            <span style={nameStyle}>{data.user.name}</span>
            {" "}{t("startedGoal")}{" "}
            <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{data.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{
              ...catStyle,
              border: "2px solid #1a1a2e",
              borderRadius: "100px",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {data.category}
          </span>
          {ts}
        </div>
      </div>
    );
  }

  // ── Nomination accepted ───────────────────────────────────────────────────
  if (item.type === "nomination") {
    const { data } = item;
    return (
      <div
        style={{
          ...comicCard,
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.recipient.name} url={data.recipient.avatar_url} size="sm" />
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#555",
              minWidth: 0,
            }}
          >
            <span style={nameStyle}>{data.recipient.name}</span>
            {" "}{t("acceptedNomination")}{" "}
            <span style={nameStyle}>{data.nominator.name}</span>
            {t("nominationSuffix")}{" "}
            <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{data.title}</span>
          </p>
        </div>
        {ts}
      </div>
    );
  }

  // ── Challenge triggered ───────────────────────────────────────────────────
  if (item.type === "challenge") {
    const { data } = item;
    return (
      <div
        style={{
          background: "#fff3e0",
          border: "3px solid #f39c12",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #f39c12",
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#B36200",
              minWidth: 0,
            }}
          >
            <span style={{ ...nameStyle, color: "#B36200" }}>{data.user.name}</span>
            {" "}{t("newChallenge")}{" "}
            <span style={{ fontWeight: 700 }}>{data.goal.title}</span>
            {t("challengeSuffix")}
          </p>
        </div>
        {ts}
      </div>
    );
  }

  // ── Penalty ───────────────────────────────────────────────────────────────
  if (item.type === "penalty") {
    const { data } = item;
    return (
      <div
        style={{
          background: "#ffe0e0",
          border: "3px solid #e74c3c",
          borderRadius: "16px",
          boxShadow: "3px 3px 0 #e74c3c",
          padding: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#C0392B",
              minWidth: 0,
            }}
          >
            <span style={{ ...nameStyle, color: "#C0392B" }}>{data.user.name}</span>
            {" "}{t("missed")}{" "}
            <span style={{ fontWeight: 700 }}>{data.goal.title}</span>
            {" "}{t("missedSuffix")}
          </p>
        </div>
        <p
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#e74c3c",
            flexShrink: 0,
          }}
        >
          +€{Number(data.amount).toFixed(2)}
        </p>
      </div>
    );
  }
}
