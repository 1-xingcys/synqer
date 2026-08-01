"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  LIFF_ENTRY_COOKIE_NAME,
  LiffEntryAction,
  resolveLiffEntryAction,
  type LiffEntryDecision,
} from "@/lib/liffEntry";
import { getLiffId, initializeLiff, isLineUserAgent } from "@/lib/liff";
import { LoadingState } from "@/components/ui/loading-state";

/** URL we have already routed through the LIFF entry flow, per browser tab. */
const LIFF_ENTRY_HANDLED_KEY = "synqer:liff-entry-handled:url";

function readHandledEntryUrl(): string | null {
  try {
    return sessionStorage.getItem(LIFF_ENTRY_HANDLED_KEY);
  } catch {
    return null;
  }
}

function writeHandledEntryUrl(url: string): void {
  try {
    sessionStorage.setItem(LIFF_ENTRY_HANDLED_KEY, url);
  } catch {
    // Private mode or a full quota: the worst case is one extra forward
  }
}

function hasLiffEntryCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((entry) => entry.startsWith(`${LIFF_ENTRY_COOKIE_NAME}=`));
}

/**
 * The decision depends only on the URL and two storage reads, none of which
 * change while the document is alive, so it is computed once and cached. The
 * cache also keeps the snapshot referentially stable for useSyncExternalStore.
 */
let cachedDecision: LiffEntryDecision | null = null;

function getClientDecision(): LiffEntryDecision {
  if (!cachedDecision) {
    const currentUrl = window.location.href;
    cachedDecision = resolveLiffEntryAction({
      url: currentUrl,
      liffId: getLiffId(),
      isLineUserAgent: isLineUserAgent(),
      arrivedFromLiff:
        hasLiffEntryCookie() || readHandledEntryUrl() === currentUrl,
    });
  }
  return cachedDecision;
}

/** The server cannot see the URL fragment, cookies or sessionStorage. */
function getServerDecision(): null {
  return null;
}

/** Nothing to subscribe to: the decision is fixed for the document's lifetime. */
const subscribe = () => () => {};

/**
 * Whether this document could possibly need a LIFF redirect.
 *
 * Read from the URL rather than useSearchParams: that hook forces the nearest
 * Suspense boundary's fallback into the prerendered HTML, which on the static
 * landing page would mean shipping an empty document.
 */
const getClientNeedsLiffCheck = () =>
  isLineUserAgent() ||
  new URLSearchParams(window.location.search).has("liff.state");

/** The server render knows nothing beyond the isLineClient prop. */
const getServerNeedsLiffCheck = () => false;

/**
 * LiffPathHandler
 *
 * Resolves how a document reached us from LINE, and redirects when the URL says
 * it has to. The decision itself lives in lib/liffEntry and is derived from the
 * URL, so the common case costs no LIFF SDK call — asking the SDK cost 4s on a
 * cold start, spent showing a spinner on a page that had nothing to do.
 *
 * Must run before any other auth logic on the pages that mount it.
 *
 * @param isLineClient Passed in by (protected)/layout.tsx after checking the
 *   User-Agent, so the server already knows whether to block children. The
 *   prerendered landing page has no request to read, and omits it: the check
 *   then happens on the client, and a LINE visitor may see a frame of content
 *   before being forwarded.
 */
export function LiffPathHandler({
  children,
  isLineClient = false,
}: {
  children: React.ReactNode;
  isLineClient?: boolean;
}): React.ReactNode {
  const clientNeedsLiffCheck = useSyncExternalStore(
    subscribe,
    getClientNeedsLiffCheck,
    getServerNeedsLiffCheck,
  );

  // Only LIFF-related requests can ever redirect, so only they need to be held
  // back. A regular browser never redirects here, and blocking it would just
  // stop the whole tree from server rendering.
  const needsLiffCheck = isLineClient || clientNeedsLiffCheck;

  // null until the client has rendered: the decision needs browser-only state,
  // so the server always reports "not known yet".
  const decision = useSyncExternalStore(
    subscribe,
    getClientDecision,
    getServerDecision,
  );

  // Three states: "checking" | "redirecting" | "done".
  // Children are not rendered until we know no redirect is needed, which avoids
  // loading unnecessary chunks while a redirect is in flight. "checking" now
  // lasts a single frame: the decision is synchronous.
  const status =
    !needsLiffCheck || decision?.action === LiffEntryAction.Continue
      ? "done"
      : decision === null
        ? "checking"
        : "redirecting";

  useEffect(() => {
    if (!needsLiffCheck || decision === null) return;

    if (decision.action === LiffEntryAction.Continue) return;

    if (decision.action === LiffEntryAction.ForwardToLiffEntry) {
      writeHandledEntryUrl(window.location.href);
      window.location.replace(decision.entryUrl);
      return;
    }

    // RedirectToStatePath. The destination is a plain in-app-browser URL again;
    // without this marker its forward branch would bounce back to liff.line.me.
    const { targetPath } = decision;
    writeHandledEntryUrl(new URL(targetPath, window.location.origin).href);

    if (decision.awaitLiffInit) {
      // LINE Login callback: liff.init() exchanges ?code for a token, and the
      // redirect drops the query, so it has to finish first.
      void initializeLiff().finally(() => {
        window.location.replace(targetPath);
      });
      return;
    }

    window.location.replace(targetPath);
  }, [needsLiffCheck, decision]);

  // Show loading while checking or redirecting. This avoids loading the
  // children's chunks mid-redirect and prevents "Failed to load chunk" errors.
  if (status === "checking" || status === "redirecting") {
    return (
      <LoadingState
        viewport="screen"
        background="muted"
        spinnerTone="neutral"
      />
    );
  }

  // status === "done"
  return children;
}
