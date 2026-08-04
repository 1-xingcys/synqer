import { splitLocale } from "@/i18n/locales";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";

/**
 * Routing decisions the server can make before any client JavaScript runs.
 */

/** Session cookie issued by the API; scoped to .synqer.club in production. */
export const SESSION_COOKIE_NAME = "synqer.sid";

/**
 * Query flag ProtectedLayout adds when it sends a rejected session back to
 * /login. The login page only sees the *presence* of the session cookie, so
 * without this marker a cookie the API has already invalidated would bounce
 * between the two forever.
 */
export const SESSION_EXPIRED_PARAM = "expired";

/**
 * First URL segment of every route under app/[locale]/(protected).
 *
 * The retired "hosted" and "joined" segments are absent on purpose: middleware
 * redirects them onto /events before the gate runs, so they never arrive here.
 */
const PROTECTED_SEGMENTS = ["events", "new"];

/** Matches LINE's in-app browser. */
const LINE_USER_AGENT_PATTERN = /Line/i;

export function matchesLineUserAgent(userAgent: string): boolean {
  return LINE_USER_AGENT_PATTERN.test(userAgent);
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

/**
 * Constrain a `?redirect` value to a path on this origin.
 *
 * Shared by the login page's own redirect and by the hrefs it hands to the
 * OAuth providers, so an open redirect cannot slip in through either.
 */
export function validateRedirectPath(redirect: string | null): string {
  if (!redirect) return DEFAULT_OVERVIEW_PATH;

  // "//evil.example.com" is a protocol-relative URL, not a path.
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return DEFAULT_OVERVIEW_PATH;
  }

  return redirect;
}

interface SignedInRedirectRequest {
  hasSessionCookie: boolean;
  /** Raw `?redirect` value, before validation. */
  redirect: string | null;
  /** True when ProtectedLayout sent this request back after /auth/me failed. */
  sessionExpired: boolean;
}

/**
 * Decide whether a request for the login page should skip it.
 *
 * Mirrors resolveLoginRedirect: only the presence of the cookie is checked, so
 * a stale one still reaches the app and is caught by ProtectedLayout — which
 * then sets sessionExpired to stop the two from redirecting at each other.
 *
 * @returns the path to send the visitor to, or null to render the login page.
 */
export function resolveSignedInRedirect({
  hasSessionCookie,
  redirect,
  sessionExpired,
}: SignedInRedirectRequest): string | null {
  if (!hasSessionCookie || sessionExpired) return null;
  return validateRedirectPath(redirect);
}
