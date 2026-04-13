import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const { pathname } = nextUrl;

  // Routes that never require authentication
  const isNextAuthRoute = pathname.startsWith("/api/auth");
  const isLoginRoute    = pathname === "/login";
  const isRegisterRoute = pathname === "/register";
  const isJoinRoute     = pathname.startsWith("/join/");

  if (isNextAuthRoute || isJoinRoute) return NextResponse.next();

  // Auth pages — redirect logged-in users away
  if (isLoginRoute || isRegisterRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/profile", nextUrl));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    // Preserve the intended destination so login can redirect back
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
