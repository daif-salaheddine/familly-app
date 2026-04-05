import { prisma } from "./db";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReactionData {
  id: string;
  user_id: string;
  emoji: string;
}

export interface CheckinFeedItem {
  type: "checkin";
  created_at: Date;
  data: {
    id: string;
    media_url: string;
    caption: string | null;
    user: { id: string; name: string };
    goal: { id: string; title: string };
    reactions: ReactionData[];
  };
}

export interface GoalFeedItem {
  type: "goal";
  created_at: Date;
  data: {
    id: string;
    title: string;
    category: string;
    user: { id: string; name: string };
  };
}

export interface NominationFeedItem {
  type: "nomination";
  created_at: Date;
  data: {
    id: string;
    title: string;
    recipient: { id: string; name: string };
    nominator: { id: string; name: string };
  };
}

export interface ChallengeFeedItem {
  type: "challenge";
  created_at: Date;
  data: {
    id: string;
    user: { id: string; name: string };
    goal: { id: string; title: string };
  };
}

export interface PenaltyFeedItem {
  type: "penalty";
  created_at: Date;
  data: {
    id: string;
    amount: string;
    user: { id: string; name: string };
    goal: { id: string; title: string };
  };
}

export type FeedItem =
  | CheckinFeedItem
  | GoalFeedItem
  | NominationFeedItem
  | ChallengeFeedItem
  | PenaltyFeedItem;

// ─── Query ───────────────────────────────────────────────────────────────────

export async function getGroupFeed(groupId: string): Promise<FeedItem[]> {
  const [checkins, goals, nominations, challenges, penalties] =
    await Promise.all([
      prisma.checkin.findMany({
        where: { goal: { group_id: groupId } },
        include: {
          user: { select: { id: true, name: true } },
          goal: { select: { id: true, title: true } },
          reactions: { select: { id: true, user_id: true, emoji: true } },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),

      prisma.goal.findMany({
        where: { group_id: groupId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { created_at: "desc" },
        take: 50,
      }),

      prisma.nomination.findMany({
        where: { group_id: groupId, status: "accepted" },
        include: {
          toUser: { select: { id: true, name: true } },
          fromUser: { select: { id: true, name: true } },
        },
        orderBy: { responded_at: "desc" },
        take: 50,
      }),

      prisma.challenge.findMany({
        where: { group_id: groupId },
        include: {
          user: { select: { id: true, name: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),

      prisma.penalty.findMany({
        where: { group_id: groupId },
        include: {
          user: { select: { id: true, name: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
    ]);

  const items: FeedItem[] = [
    ...checkins.map(
      (c): CheckinFeedItem => ({
        type: "checkin",
        created_at: c.created_at,
        data: {
          id: c.id,
          media_url: c.media_url,
          caption: c.caption,
          user: c.user,
          goal: c.goal,
          reactions: c.reactions,
        },
      })
    ),
    ...goals.map(
      (g): GoalFeedItem => ({
        type: "goal",
        created_at: g.created_at,
        data: {
          id: g.id,
          title: g.title,
          category: g.category,
          user: g.user,
        },
      })
    ),
    ...nominations.map(
      (n): NominationFeedItem => ({
        type: "nomination",
        created_at: n.responded_at ?? n.created_at,
        data: {
          id: n.id,
          title: n.title,
          recipient: n.toUser,
          nominator: n.fromUser,
        },
      })
    ),
    ...challenges.map(
      (c): ChallengeFeedItem => ({
        type: "challenge",
        created_at: c.created_at,
        data: {
          id: c.id,
          user: c.user,
          goal: c.goal,
        },
      })
    ),
    ...penalties.map(
      (p): PenaltyFeedItem => ({
        type: "penalty",
        created_at: p.created_at,
        data: {
          id: p.id,
          amount: p.amount.toString(),
          user: p.user,
          goal: p.goal,
        },
      })
    ),
  ];

  return items
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, 50);
}
