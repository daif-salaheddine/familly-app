import { auth } from "../auth";
import type { SessionUser } from "../types";

/**
 * Call at the top of every API route to verify the session.
 * Returns the session user or throws a 401 Response.
 */
export async function getUser(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ data: null, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    has_onboarded: session.user.has_onboarded,
  };
}
