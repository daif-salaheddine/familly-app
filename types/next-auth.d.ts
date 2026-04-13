import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      has_onboarded: boolean;
    };
  }

  interface User {
    has_onboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    has_onboarded: boolean;
  }
}
