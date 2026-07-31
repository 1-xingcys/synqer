import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE_NAME, resolveLoginRedirect } from "./lib/auth-gate";

const handleIntl = createIntlMiddleware(routing);

/**
 * Authentication happens in two layers:
 * 1. This one only blocks requests that do not even carry a session cookie, so
 *    signed-out visitors are redirected without first downloading the whole JS
 *    bundle, and protected pages can be server rendered directly.
 * 2. Requests whose cookie exists but is no longer valid are still redirected
 *    by (protected)/layout.tsx once /auth/me responds.
 */
export default function middleware(request: NextRequest) {
  const redirectTo = resolveLoginRedirect({
    pathname: request.nextUrl.pathname,
    hasSessionCookie: request.cookies.has(SESSION_COOKIE_NAME),
    userAgent: request.headers.get("user-agent") ?? "",
  });

  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return handleIntl(request);
}

export const config = {
  matcher: ["/", "/(zh-TW|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
