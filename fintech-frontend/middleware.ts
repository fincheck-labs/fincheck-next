import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Middleware for route protection
 * NOTE: This is an OPTIMISTIC check (cookie presence only)
 * Full validation must be done on the server/page
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  /* ---------------- PUBLIC ROUTES ---------------- */
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
  ]

  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  /* ---------------- AUTH CHECK ---------------- */
  const sessionCookie = getSessionCookie(req)

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
}
