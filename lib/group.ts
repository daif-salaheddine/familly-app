import { cookies } from "next/headers";
import { prisma } from "./db";

const ACTIVE_GROUP_COOKIE = "active_group_id";

/**
 * Returns the active group ID for the user.
 *
 * Priority:
 *  1. The `active_group_id` cookie — validated against the user's actual memberships.
 *  2. Falls back to the user's earliest GroupMember record (by joined_at) if
 *     the cookie is missing or stale (e.g. user was kicked from that group).
 *
 * Throws 400 if the user is not in any group at all.
 */
export async function getActiveGroupId(userId: string): Promise<string> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;

  if (cookieValue) {
    const membership = await prisma.groupMember.findFirst({
      where: { user_id: userId, group_id: cookieValue },
      select: { group_id: true },
    });
    if (membership) return membership.group_id;
    // Cookie is stale — fall through to default
  }

  // No valid cookie: use the earliest group membership
  const firstMembership = await prisma.groupMember.findFirst({
    where: { user_id: userId },
    orderBy: { joined_at: "asc" },
    select: { group_id: true },
  });

  if (!firstMembership) {
    throw new Response(
      JSON.stringify({ data: null, error: "User is not in any group" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  return firstMembership.group_id;
}
