/**
 * Next.js Edge Middleware — first-layer route protection.
 *
 * Checks for the `ao_session` cookie (set client-side after login).
 * If absent on a protected route, redirects to /login immediately —
 * before any React code runs, which eliminates the flash of dashboard content.
 *
 * This is a lightweight guard; the authoritative check happens in RouteGuard
 * (client component) which validates the actual in-memory JWT.
 */

import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];
const SESSION_COOKIE = "ao_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Redirect authenticated users away from login/register
  if (isPublicRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
