import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./lib/db";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        // Reject if user not found or has no password (OAuth-only account)
        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          has_onboarded: user.has_onboarded,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Credentials provider is handled entirely in authorize() above
      if (account?.provider === "credentials") return true;

      // OAuth providers — find or create the user in our DB
      if (!user.email) return false;

      // This handles the account-linking edge case:
      // if someone registered with email/password and then signs in
      // with Google using the same email, they get the same DB user.
      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) {
        // First time this Google account has ever signed in — create user
        dbUser = await prisma.user.create({
          data: {
            name: user.name ?? "User",
            email: user.email,
            password_hash: null,
            email_verified: true,
            avatar_url: user.image ?? null,
            has_onboarded: false,
          },
        });
      }

      // Track the OAuth provider link (safe to call multiple times)
      if (account) {
        await prisma.account.upsert({
          where: {
            provider_provider_account_id: {
              provider: account.provider,
              provider_account_id: account.providerAccountId,
            },
          },
          create: {
            user_id: dbUser.id,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
          },
          update: {},
        });
      }

      // Replace NextAuth's auto-generated id with our DB id
      // and pass has_onboarded through to the jwt callback
      user.id = dbUser.id;
      (user as { has_onboarded?: boolean }).has_onboarded = dbUser.has_onboarded;

      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.has_onboarded =
          (user as { has_onboarded?: boolean }).has_onboarded ?? false;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.has_onboarded = token.has_onboarded as boolean;
      return session;
    },
  },
});
