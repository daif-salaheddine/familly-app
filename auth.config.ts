import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no DB imports, no Node.js built-ins.
// Used by middleware.ts. auth.ts extends this with the Credentials provider.
export const authConfig = {
  providers: [], // populated in auth.ts with Credentials provider
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
