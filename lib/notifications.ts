import { prisma } from "./db";
import type { Notification, NotificationType } from "../app/generated/prisma/client";
import { sendNominationEmail, sendChallengeEmail } from "./email";

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Returns up to 20 notifications for the user, unread first then by recency. */
export async function getNotifications(userId: string): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: [{ is_read: "asc" }, { created_at: "desc" }],
    take: 20,
  });
}

/** Returns the count of unread notifications for the user. */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Creates a notification. Designed to be fire-and-forget:
 *   void createNotification(userId, type, referenceId)
 * A failure here should never break the calling operation.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  referenceId: string
): Promise<void> {
  await prisma.notification.create({
    data: { user_id: userId, type, reference_id: referenceId },
  });

  // Fire transactional emails for critical events — fire-and-forget
  if (type === "nomination_received") {
    void sendNominationTransactional(userId, referenceId);
  } else if (type === "challenge_triggered") {
    void sendChallengeTransactional(userId, referenceId);
  }
}

async function sendNominationTransactional(
  userId: string,
  nominationId: string
): Promise<void> {
  try {
    const [recipient, nomination] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, language: true } }),
      prisma.nomination.findUnique({
        where: { id: nominationId },
        select: {
          title: true,
          penalty_amount: true,
          fromUser: { select: { name: true } },
        },
      }),
    ]);
    if (!recipient || !nomination) return;
    await sendNominationEmail(
      recipient.email,
      recipient.name,
      nomination.fromUser.name,
      nomination.title,
      Number(nomination.penalty_amount),
      recipient.language
    );
  } catch (err) {
    console.error("[notifications] nomination email failed:", err);
  }
}

async function sendChallengeTransactional(
  userId: string,
  challengeId: string
): Promise<void> {
  try {
    const [user, challenge] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, language: true } }),
      prisma.challenge.findUnique({
        where: { id: challengeId },
        select: { goal: { select: { title: true } } },
      }),
    ]);
    if (!user || !challenge) return;
    await sendChallengeEmail(user.email, user.name, challenge.goal.title, user.language);
  } catch (err) {
    console.error("[notifications] challenge email failed:", err);
  }
}

/** Marks a single notification as read. Guards ownership. */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true },
  });
}

/** Marks all of a user's notifications as read. */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
}
