import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no DB imports, no Node.js built-ins.
// Used by middleware.ts. auth.ts extends this with providers and callbacks.
export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
