import { LOCALES } from "@/i18n/locales";

/**
 * Routing decisions the server can make before any client JavaScript runs.
 */

/** Session cookie issued by the API; scoped to .synqer.club in production. */
export const SESSION_COOKIE_NAME = "synqer.sid";

/** First URL segment of every route under app/[locale]/(protected). */
const PROTECTED_SEGMENTS = ["events", "hosted", "joined", "new"];

/** Matches LINE's in-app browser. */
const LINE_USER_AGENT_PATTERN = /Line/i;

export function matchesLineUserAgent(userAgent: string): boolean {
  return LINE_USER_AGENT_PATTERN.test(userAgent);
}

/**
 * Split a pathname into its locale prefix and the locale-less remainder.
 * "/zh-TW/new" -> { locale: "zh-TW", path: "/new" }
 */
export function splitLocale(pathname: string): {
  locale: string | null;
  path: string;
} {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) {
      return { locale, path: "/" };
    }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: null, path: pathname };
}

export function isProtectedPath(pathname: string): boolean {
  const { path } = splitLocale(pathname);
  const segment = path.split("/")[1] ?? "";
  return PROTECTED_SEGMENTS.includes(segment);
}

interface AuthGateRequest {
  pathname: string;
  hasSessionCookie: boolean;
  userAgent: string;
}

/**
 * Decide whether a request to a protected page must be sent to /login first.
 *
 * Only the *presence* of the session cookie is checked — validating it would
 * cost an API round trip on every navigation. A stale cookie still reaches the
 * page and gets redirected by ProtectedLayout once /auth/me answers.
 *
 * @returns the redirect target, or null to let the request through.
 */
export function resolveLoginRedirect({
  pathname,
  hasSessionCookie,
  userAgent,
}: AuthGateRequest): string | null {
  if (hasSessionCookie || !isProtectedPath(pathname)) {
    return null;
  }

  // LINE's in-app browser carries no cookie on first entry — LIFF establishes
  // the session client-side, so /login would cut that handshake short.
  if (matchesLineUserAgent(userAgent)) {
    return null;
  }

  const { locale, path } = splitLocale(pathname);
  const loginPath = `${locale ? `/${locale}` : ""}/login`;
  return `${loginPath}?redirect=${encodeURIComponent(path)}`;
}
