import { getTranslations } from "next-intl/server";
import type { FeedItem as FeedItemType, ReactionData } from "../../lib/feed";
import ReactionBar from "./ReactionBar";
import Avatar from "../ui/Avatar";

const CATEGORY_COLORS: Record<string, string> = {
  body: "bg-orange-100 text-orange-700",
  mind: "bg-blue-100 text-blue-700",
  soul: "bg-purple-100 text-purple-700",
  work: "bg-yellow-100 text-yellow-700",
  relationships: "bg-pink-100 text-pink-700",
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

export default async function FeedItem({
  item,
  currentUserId,
}: {
  item: FeedItemType;
  currentUserId: string;
}) {
  const t = await getTranslations("feed");

  const ts = (
    <span className="text-xs text-gray-400">{timeAgo(item.created_at, t)}</span>
  );

  // ── Checkin ──────────────────────────────────────────────────────────────
  if (item.type === "checkin") {
    const { data } = item;
    const video = isVideo(data.media_url);
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Media */}
        <div className="bg-black">
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

        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {data.user.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{data.goal.title}</p>
              </div>
            </div>
            {ts}
          </div>

          {/* Caption */}
          {data.caption && (
            <p className="text-sm text-gray-700">{data.caption}</p>
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
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
          <p className="text-sm text-gray-700 min-w-0">
            <span className="font-semibold text-gray-900">{data.user.name}</span>
            {" "}{t("startedGoal")}{" "}
            <span className="font-medium text-gray-900">{data.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[data.category] ?? "bg-gray-100 text-gray-600"}`}
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
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.recipient.name} url={data.recipient.avatar_url} size="sm" />
          <p className="text-sm text-gray-700 min-w-0">
            <span className="font-semibold text-gray-900">
              {data.recipient.name}
            </span>
            {" "}{t("acceptedNomination")}{" "}
            <span className="font-semibold text-gray-900">
              {data.nominator.name}
            </span>
            {t("nominationSuffix")}{" "}
            <span className="font-medium text-gray-900">{data.title}</span>
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
      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
          <p className="text-sm text-orange-800 min-w-0">
            <span className="font-semibold">{data.user.name}</span>
            {" "}{t("newChallenge")}{" "}
            <span className="font-medium">{data.goal.title}</span>
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
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={data.user.name} url={data.user.avatar_url} size="sm" />
          <p className="text-sm text-red-800 min-w-0">
            <span className="font-semibold">{data.user.name}</span>
            {" "}{t("missed")}{" "}
            <span className="font-medium">{data.goal.title}</span>
            {" "}{t("missedSuffix")}{" "}€{Number(data.amount).toFixed(2)} {t("addedToPot")}
          </p>
        </div>
        {ts}
      </div>
    );
  }
}
