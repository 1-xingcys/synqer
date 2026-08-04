import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE_NAME, resolveLoginRedirect } from "./lib/auth-gate";
import { resolveLegacyEventRedirect } from "./lib/legacyEventRoutes";
import {
  LIFF_ENTRY_COOKIE_NAME,
  resolveLiffStateServerRedirect,
} from "./components/providers/liffEntry";

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
  // A LIFF launch arrives as /{locale}?liff.state=/path. Resolving it here
  // saves a whole client document whose only job was to redirect.
  const liffTarget = resolveLiffStateServerRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  });

  if (liffTarget) {
    const response = NextResponse.redirect(new URL(liffTarget, request.url));
    // Tells LiffPathHandler on the destination document that it is inside a
    // LIFF launch, so it does not forward back to liff.line.me. It only has to
    // survive this one redirect hop — a session-length cookie would outlive the
    // launch and suppress a genuine forward later in the same LINE session.
    response.cookies.set(LIFF_ENTRY_COOKIE_NAME, "1", {
      path: "/",
      sameSite: "lax",
      maxAge: 120,
    });
    return response;
  }

  // The /hosted and /joined trees have no route files left, so their old links
  // are answered here. This runs before the auth gate so a signed-out visitor
  // arriving on an old link comes back to the new path after logging in.
  const legacyTarget = resolveLegacyEventRedirect(request.nextUrl.pathname);

  if (legacyTarget) {
    return NextResponse.redirect(
      new URL(`${legacyTarget}${request.nextUrl.search}`, request.url),
      308,
    );
  }

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
