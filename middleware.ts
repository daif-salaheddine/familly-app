import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const { pathname } = nextUrl;

  // Helper: pass through but inject the current pathname as a header
  // so server layouts can read it without a separate headers() call.
  function passThrough() {
    const headers = new Headers(req.headers);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  // Routes that never require authentication
  const isNextAuthRoute = pathname.startsWith("/api/auth");
  const isJoinRoute     = pathname.startsWith("/join/");

  if (isNextAuthRoute || isJoinRoute) return passThrough();

  // Auth pages (/login, /register) — redirect logged-in users away
  const isLoginRoute    = pathname === "/login";
  const isRegisterRoute = pathname === "/register";

  if (isLoginRoute || isRegisterRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/profile", nextUrl));
    }
    return passThrough();
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    // Preserve the intended destination so login can redirect back
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return passThrough();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
