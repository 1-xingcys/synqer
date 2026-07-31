/**
 * Routing decisions for a LIFF launch, derived from the URL alone.
 *
 * Deliberately free of `window`, React and the LIFF SDK: the same decision has
 * to be reachable from middleware, and asking the SDK costs a cold-start
 * `liff.init()` (measured at 4s) for an answer the URL already contains.
 */

import { LOCALES } from "@/i18n/locales";

/**
 * Set by middleware on a `liff.state` redirect so the destination document
 * knows it is running inside a LIFF launch without asking the SDK.
 */
export const LIFF_ENTRY_COOKIE_NAME = "synqer.liff-entry";

export const LiffEntryAction = {
  /** The URL carries liff.state; replace it with the embedded path. */
  RedirectToStatePath: "redirect-to-state-path",
  /** A plain URL opened in LINE's in-app browser; send it through LIFF. */
  ForwardToLiffEntry: "forward-to-liff-entry",
  /** Nothing to do; render the page. */
  Continue: "continue",
} as const;
export type LiffEntryAction =
  (typeof LiffEntryAction)[keyof typeof LiffEntryAction];

export type LiffEntryDecision =
  | { action: typeof LiffEntryAction.Continue }
  | {
      action: typeof LiffEntryAction.RedirectToStatePath;
      targetPath: string;
      /**
       * True when the URL carries LINE Login callback parameters. The caller
       * must let liff.init() resolve before navigating, because that call is
       * what exchanges the code for a token.
       */
      awaitLiffInit: boolean;
    }
  | { action: typeof LiffEntryAction.ForwardToLiffEntry; entryUrl: string };

export interface LiffEntryInput {
  /** window.location.href */
  url: string;
  /** NEXT_PUBLIC_LINE_LIFF_ID, or "" when unset. */
  liffId: string;
  isLineUserAgent: boolean;
  /** True when this document is already known to be inside a LIFF launch. */
  arrivedFromLiff: boolean;
}

const CONTINUE: LiffEntryDecision = { action: LiffEntryAction.Continue };

/** Matches a pathname that is only a locale prefix, e.g. "/en" or "/zh-TW/". */
const LOCALE_ONLY_PATHNAME = /^\/[a-z]{2}(-[A-Z]{2})?\/?$/;

/** Matches a locale prefix followed by a boundary, so "/enterprise" is not "en". */
const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join("|")})(/|$)`);

export function hasLoginCallbackParams(url: URL): boolean {
  if (url.searchParams.has("code")) return true;
  return url.hash.includes("access_token") || url.hash.includes("id_token");
}

/**
 * Read the path LINE stored in liff.state.
 * Returns null unless it decodes to a same-origin path.
 */
function readLiffStatePath(search: string): string | null {
  const raw = new URLSearchParams(search).get("liff.state");
  if (!raw) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  // "//evil.example.com" is a protocol-relative URL, not a path.
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  return decoded;
}

/**
 * Where a liff.state path should land, or null when no redirect is needed.
 * Only fires from the entry page (root, or a bare locale), which is the only
 * place LINE ever puts liff.state.
 */
function resolveLiffStateTarget(
  pathname: string,
  statePath: string,
): string | null {
  const isEntryPathname =
    pathname === "/" || LOCALE_ONLY_PATHNAME.test(pathname);
  if (!isEntryPathname) return null;

  if (LOCALE_PREFIX.test(statePath)) return statePath;

  const locale = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)/)?.[1];
  return locale ? `/${locale}${statePath}` : statePath;
}

export function resolveLiffEntryAction(
  input: LiffEntryInput,
): LiffEntryDecision {
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return CONTINUE;
  }

  // Anything carrying liff.state is resolved here or not at all. Falling
  // through to the forward branch would send a launch URL back to LINE.
  if (url.searchParams.has("liff.state")) {
    const statePath = readLiffStatePath(url.search);
    const targetPath = statePath
      ? resolveLiffStateTarget(url.pathname, statePath)
      : null;
    if (!targetPath) return CONTINUE;
    return {
      action: LiffEntryAction.RedirectToStatePath,
      targetPath,
      awaitLiffInit: hasLoginCallbackParams(url),
    };
  }

  // A login callback has to stay put until the SDK has consumed it.
  if (hasLoginCallbackParams(url)) return CONTINUE;

  if (!input.liffId || !input.isLineUserAgent || input.arrivedFromLiff) {
    return CONTINUE;
  }

  return {
    action: LiffEntryAction.ForwardToLiffEntry,
    entryUrl: `https://liff.line.me/${input.liffId}${url.pathname}${url.search}${url.hash}`,
  };
}

/**
 * The middleware's view of the same decision: only the liff.state redirect,
 * because the server cannot see the fragment and must not touch a login
 * callback.
 */
export function resolveLiffStateServerRedirect({
  pathname,
  search,
}: {
  pathname: string;
  search: string;
}): string | null {
  if (new URLSearchParams(search).has("code")) return null;

  // On "/" the locale is not decided yet. Let next-intl redirect to
  // "/{locale}?liff.state=..." first; this fires on that second pass.
  if (pathname === "/") return null;

  const statePath = readLiffStatePath(search);
  if (!statePath) return null;

  return resolveLiffStateTarget(pathname, statePath);
}
