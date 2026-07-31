# LIFF Cold Start Latency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the time between tapping a LIFF link in LINE and seeing the page from ~6.4s (cold) to ~1.5s, by never blocking a render on `liff.init()` and by removing the throwaway document that only exists to redirect.

**Architecture:** Every routing decision the LIFF entry flow makes is moved out of `LiffPathHandler`'s async effect into one pure module, `lib/liffEntry.ts`, that decides from the URL alone. The LIFF SDK is then only needed for the one case that genuinely requires it — a LINE Login callback carrying `?code` — so the common case resolves synchronously. Once the decision is pure, the same function runs in `middleware.ts` and the `liff.state` bounce becomes a server 307 instead of a full client document.

**Tech Stack:** TypeScript 5.9, Next.js 16 (App Router, `output: "standalone"`), React 19.2, `@line/liff` 2.24, next-intl, jest + ts-jest (`testEnvironment: "node"`, `testMatch: ["**/*.test.ts"]` — no component tests), eslint + prettier.

## Global Constraints

- Run every command from `frontend/`.
- Verification for every task: `npx tsc --noEmit`, `npx eslint .`, `npx jest` — all clean before the commit step.
- Jest only collects `*.test.ts` under `testEnvironment: "node"`. There is no jsdom and no `@testing-library`, so **no component may be tested by rendering**. Logic that needs a test goes into a `.ts` module under `lib/`.
- `generated/openapi.ts` is generated. Never edit it; revert it if prettier touches it: `git checkout -- generated/openapi.ts`.
- **Never navigate away from a URL carrying LINE Login callback parameters (`code` in the query, `access_token`/`id_token` in the hash) before `liff.init()` has resolved.** That call is what exchanges the code for a token. Every task must preserve this.
- The locale list is `["en", "zh-TW"]` (`i18n/locales.ts`). `zh-TW` is the default. Any regex matching a locale prefix must be anchored with a `/` or end-of-string boundary so `/enterprise` is not read as locale `en`.
- Commit messages: English, no emojis, end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Do not commit until the user has reviewed the working tree.** Implement and verify first; the commit step in each task runs after their approval.
- PR description: English, no emojis, no testing section.

---

## Background: the measurements this plan is built on

Taken on a production build (`node .next/standalone/server.js`) served through the existing nginx + tunnel to `jbro.synqer.club`, opened from LINE on iOS. Instrumentation is the temporary `lib/perfTrace.ts` + `components/PerfTraceOverlay.tsx` overlay.

**Cold (first launch after the app had not been opened), total wall time 6423ms:**

| Segment | Cost |
|---|---|
| nav 1 `/en?liff.state=%2Fnew` — document to JS eval | 743ms |
| nav 1 — waiting on `initializeLiff()` before `location.replace` | 740ms |
| nav 2 `/en/new` — document to JS eval | 129ms |
| **nav 2 — `LoadingState` shown while `liff.init()` runs** | **4067ms** |
| nav 2 — `/auth/me` + `/events/mine` | 240ms |
| nav 2 — trailing duplicate `initializeLiff()` / `getProfile()` | 720ms |

**Warm (second launch), total wall time 1824ms.** The same `liff.init()` takes 101ms warm, which is why this is invisible during development.

Inside the cold 4067ms, the largest single item is the LIFF SDK fetching `https://static.line-scdn.net/liff/edge/versions/2.22.0/sdk/ios-extensions_2_22_0.js` — 1425ms on a cold connection.

Two facts drive the design:

1. On nav 2 the URL is a plain `/en/new` with no `liff.state`. `LiffPathHandler` calls `initializeLiff()` there for exactly one reason: to read `liffState.isInClient` and conclude "Already in LIFF client". It blocks the page for 4 seconds to learn it has nothing to do.
2. On the warm run, nav 1 shows `liff.init()` starting but never completing, and the navigation to `/en/new` still happens at +349ms. The LIFF SDK performs the `liff.state` redirect itself. Our manual redirect and the SDK's race each other; whichever finishes first wins. The manual one is not load-bearing for anything except the login-callback case.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/liffEntry.ts` (new) | Every LIFF entry routing decision, as pure functions over a URL. Shared by the middleware and the client handler. No `window`, no SDK, no React. |
| `lib/liffEntry.test.ts` (new) | Unit tests for the above. |
| `lib/liff.ts` (modify) | SDK loading and LIFF API wrappers only. Loses the URL-parsing helpers to `liffEntry.ts`; gains promise caches so one document runs `liff.init()` and `getProfile()` once. |
| `lib/liff.test.ts` (new) | Tests the promise caches with a mocked `@line/liff`. |
| `components/LiffPathHandler.tsx` (modify) | Thin adapter: read the browser's state, call `resolveLiffEntryAction`, act on the result. |
| `middleware.ts` (modify) | Serves the `liff.state` redirect as a 307 before any HTML is produced. |
| `app/[locale]/layout.tsx` (modify) | `preconnect` to the LIFF SDK's CDN. |
| `contexts/LiffContext.tsx` | Unchanged. Becomes the single `useLiff()` call site. |

---

## Task 0: Branch and land the instrumentation

The measurements above come from uncommitted working-tree changes. Commit them first so the whole optimisation is measured against a fixed baseline and the instrumentation can be removed with one revert at the end.

**Files:**
- Modify: `frontend/app/[locale]/layout.tsx`, `frontend/components/LiffPathHandler.tsx`, `frontend/hooks/useAuth.ts`, `frontend/hooks/useLiff.ts`, `frontend/lib/apiClient.ts`, `frontend/lib/liff.ts` (already modified in the working tree)
- Create: `frontend/lib/perfTrace.ts`, `frontend/components/PerfTraceOverlay.tsx` (already present in the working tree)
- Decide: `.claude/launch.json` (untracked)

- [ ] **Step 1: Create the branch**

```bash
git checkout -b perf/liff-cold-start
```

- [ ] **Step 2: Decide what happens to `.claude/`**

`.claude/launch.json` was added to let the preview tooling start the dev server. It is developer tooling, not app code. Either commit it or add `.claude/` to `.gitignore` — pick one and do not leave it untracked, so later `git status` output stays readable.

- [ ] **Step 3: Verify**

```bash
cd frontend && npx tsc --noEmit && npx eslint . && npx jest
```

Expected: tsc silent, eslint reports only the pre-existing `css-modules.d.ts` prettier warning, jest 35 suites / 243 tests pass.

- [ ] **Step 4: Commit (after user review)**

```bash
git add -A && git commit -m "chore(frontend): add temporary LIFF load-time instrumentation

Records each loading stage into sessionStorage with absolute timestamps so
the trace survives the hard navigations of a LIFF launch, and renders it as
an on-screen timeline. Removed once the slow stage is fixed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 1: Pure LIFF entry decision module

**Files:**
- Create: `frontend/lib/liffEntry.ts`
- Test: `frontend/lib/liffEntry.test.ts`

**Interfaces:**
- Consumes: `LOCALES` from `@/i18n/locales`.
- Produces:
  - `LiffEntryAction` (const object + type) with members `RedirectToStatePath`, `ForwardToLiffEntry`, `Continue`
  - `LiffEntryDecision` — discriminated union on `action`
  - `resolveLiffEntryAction(input: LiffEntryInput): LiffEntryDecision`
  - `resolveLiffStateServerRedirect(input: { pathname: string; search: string }): string | null` (used by Task 4)
  - `hasLoginCallbackParams(url: URL): boolean`
  - `LIFF_ENTRY_COOKIE_NAME: "synqer.liff-entry"` (used by Tasks 2 and 4)

Nothing imports this module yet, so this task changes no behaviour.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/liffEntry.test.ts`:

```ts
import {
  LiffEntryAction,
  hasLoginCallbackParams,
  resolveLiffEntryAction,
  resolveLiffStateServerRedirect,
} from "@/lib/liffEntry";

const LIFF_ID = "2008737136-VvaKkvyd";
const ORIGIN = "https://jbro.synqer.club";

const base = {
  liffId: LIFF_ID,
  isLineUserAgent: true,
  arrivedFromLiff: false,
};

describe("hasLoginCallbackParams", () => {
  it("detects the authorization code flow", () => {
    expect(
      hasLoginCallbackParams(new URL(`${ORIGIN}/en?code=abc&state=xyz`)),
    ).toBe(true);
  });

  it("detects tokens carried in the fragment", () => {
    expect(
      hasLoginCallbackParams(new URL(`${ORIGIN}/en#access_token=abc`)),
    ).toBe(true);
    expect(hasLoginCallbackParams(new URL(`${ORIGIN}/en#id_token=abc`))).toBe(
      true,
    );
  });

  it("does not fire on a plain LIFF launch", () => {
    expect(
      hasLoginCallbackParams(new URL(`${ORIGIN}/en?liff.state=%2Fnew`)),
    ).toBe(false);
  });
});

describe("resolveLiffEntryAction — liff.state redirect", () => {
  it("prefixes the current locale onto a locale-less state path", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fnew`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/en/new",
      awaitLiffInit: false,
    });
  });

  it("keeps a state path that already carries a locale", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fzh-TW%2Fjoined%2Fabc`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/zh-TW/joined/abc",
      awaitLiffInit: false,
    });
  });

  it("does not mistake a lookalike segment for a locale prefix", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fenterprise`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/en/enterprise",
      awaitLiffInit: false,
    });
  });

  it("asks the caller to await liff.init() on a login callback", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fnew&code=abc&state=xyz`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/en/new",
      awaitLiffInit: true,
    });
  });

  it("continues when the state path points at the current page", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en/new?liff.state=%2Fnew`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("ignores a state value that is not a path", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=https%3A%2F%2Fevil.example.com`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });
});

describe("resolveLiffEntryAction — forwarding a plain LINE URL into LIFF", () => {
  it("forwards a plain in-app-browser URL to liff.line.me", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en/joined/abc?tab=results`,
      }),
    ).toEqual({
      action: LiffEntryAction.ForwardToLiffEntry,
      entryUrl: `https://liff.line.me/${LIFF_ID}/en/joined/abc?tab=results`,
    });
  });

  it("does not forward once we are known to be inside a LIFF launch", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        arrivedFromLiff: true,
        url: `${ORIGIN}/en/new`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("does not forward outside LINE", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        isLineUserAgent: false,
        url: `${ORIGIN}/en/new`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("does not forward without a configured LIFF id", () => {
    expect(
      resolveLiffEntryAction({ ...base, liffId: "", url: `${ORIGIN}/en/new` }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("does not forward a login callback, which the SDK must consume here", () => {
    expect(
      resolveLiffEntryAction({ ...base, url: `${ORIGIN}/en/new?code=abc` }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });
});

describe("resolveLiffStateServerRedirect", () => {
  it("resolves the same target as the client decision", () => {
    expect(
      resolveLiffStateServerRedirect({
        pathname: "/en",
        search: "?liff.state=%2Fnew",
      }),
    ).toBe("/en/new");
  });

  it("declines the root path, where the locale is not known yet", () => {
    expect(
      resolveLiffStateServerRedirect({
        pathname: "/",
        search: "?liff.state=%2Fnew",
      }),
    ).toBeNull();
  });

  it("declines a login callback so the client SDK can consume the code", () => {
    expect(
      resolveLiffStateServerRedirect({
        pathname: "/en",
        search: "?liff.state=%2Fnew&code=abc",
      }),
    ).toBeNull();
  });

  it("declines a URL without liff.state", () => {
    expect(
      resolveLiffStateServerRedirect({ pathname: "/en/new", search: "" }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest lib/liffEntry.test.ts`
Expected: FAIL — `Cannot find module '@/lib/liffEntry'`.

- [ ] **Step 3: Write the implementation**

Create `frontend/lib/liffEntry.ts`:

```ts
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
  const isEntryPathname = pathname === "/" || LOCALE_ONLY_PATHNAME.test(pathname);
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest lib/liffEntry.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 5: Full verification**

```bash
npx tsc --noEmit && npx eslint . && npx jest
```

- [ ] **Step 6: Commit (after user review)**

```bash
git add frontend/lib/liffEntry.ts frontend/lib/liffEntry.test.ts && git commit -m "feat(frontend): add pure LIFF entry routing decisions

Every decision the LIFF launch flow makes is derivable from the URL. Isolating
them here lets both the middleware and the client handler reach the same answer
without a liff.init() round trip.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: Stop blocking the page on `liff.init()`

This is the 4-second win. `LiffPathHandler` becomes a thin adapter over Task 1's decision, and only touches the SDK on a login callback.

**Files:**
- Modify: `frontend/components/LiffPathHandler.tsx` (whole file)
- Modify: `frontend/lib/liff.ts` — delete `getLiffStatePath`, `handleLiffPathRedirect`, `buildLiffEntryUrl` and the now-unused `LOCALES` import

**Interfaces:**
- Consumes: `LiffEntryAction`, `LiffEntryDecision`, `LIFF_ENTRY_COOKIE_NAME`, `resolveLiffEntryAction` from `@/lib/liffEntry`; `getLiffId`, `initializeLiff`, `isLineUserAgent` from `@/lib/liff`.
- Produces: nothing new for other tasks.

**Why the SDK check can go:** the only thing `initializeLiff()` told this component was `isInClient`, used to avoid forwarding to `liff.line.me` when we are already inside LIFF. That loop is closed instead by a session marker written at the moment we perform the `liff.state` redirect: the destination URL is recorded, so the forward branch on the next document sees `arrivedFromLiff` and stops. Task 4 adds the cookie for the case where the server, not the client, performed the redirect.

- [ ] **Step 1: Rewrite `LiffPathHandler`**

Replace the entire contents of `frontend/components/LiffPathHandler.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LIFF_ENTRY_COOKIE_NAME,
  LiffEntryAction,
  resolveLiffEntryAction,
} from "@/lib/liffEntry";
import { getLiffId, initializeLiff, isLineUserAgent } from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";
import { LoadingState } from "@/components/ui/loading-state";
// TEMPORARY: loading-time instrumentation, remove with lib/perfTrace.ts
import { perfMark } from "@/lib/perfTrace";

const log = (message: string, data?: unknown) => {
  perfMark(`LiffPathHandler · ${message}`, data);
  debugLog("LiffPath", message, data);
};

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
 * LiffPathHandler
 *
 * Resolves how a document reached us from LINE, and redirects when the URL says
 * it has to. The decision itself lives in lib/liffEntry and is derived from the
 * URL, so the common case costs no LIFF SDK call — asking the SDK cost 4s on a
 * cold start, spent showing a spinner on a page that had nothing to do.
 *
 * Must live in the root layout and run before any other auth logic.
 *
 * @param isLineClient Passed in by the root layout after checking the
 *   User-Agent, so the server already knows whether to block children.
 */
export function LiffPathHandler({
  children,
  isLineClient,
}: {
  children: React.ReactNode;
  isLineClient: boolean;
}): React.ReactNode {
  const searchParams = useSearchParams();

  // Only LIFF-related requests can ever redirect, so only they need to be held
  // back. A regular browser never redirects here, and blocking it would just
  // stop the whole tree from server rendering.
  const needsLiffCheck = isLineClient || searchParams.has("liff.state");

  // Three states: "checking" | "redirecting" | "done".
  // Children are not rendered until we know no redirect is needed, which avoids
  // loading unnecessary chunks while a redirect is in flight. "checking" now
  // lasts a single frame: the decision is synchronous.
  const [status, setStatus] = useState<"checking" | "redirecting" | "done">(
    needsLiffCheck ? "checking" : "done",
  );

  useEffect(() => {
    if (!needsLiffCheck) return;

    const currentUrl = window.location.href;
    const decision = resolveLiffEntryAction({
      url: currentUrl,
      liffId: getLiffId(),
      isLineUserAgent: isLineUserAgent(),
      arrivedFromLiff:
        hasLiffEntryCookie() || readHandledEntryUrl() === currentUrl,
    });

    log(`decision ${decision.action}`, decision);

    if (decision.action === LiffEntryAction.Continue) {
      setStatus("done");
      return;
    }

    setStatus("redirecting");

    if (decision.action === LiffEntryAction.ForwardToLiffEntry) {
      writeHandledEntryUrl(currentUrl);
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
  }, [needsLiffCheck]);

  // TEMPORARY: shows when children (and their chunks) finally start rendering
  useEffect(() => {
    perfMark(`LiffPathHandler · status = ${status}`);
  }, [status]);

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
```

- [ ] **Step 2: Delete the superseded helpers from `lib/liff.ts`**

Remove these three exported functions in full: `getLiffStatePath`, `handleLiffPathRedirect`, `buildLiffEntryUrl`. Remove `import { LOCALES } from "@/i18n/locales";` — nothing else in the file uses it. Keep `matchesLineUserAgent` and `isLineUserAgent`.

- [ ] **Step 3: Confirm nothing else referenced them**

Run:

```bash
grep -rn "handleLiffPathRedirect\|getLiffStatePath\|buildLiffEntryUrl" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules
```

Expected: no output. If anything appears, it is a call site that must be migrated to `resolveLiffEntryAction` before continuing.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npx eslint . && npx jest
```

Expected: all clean. No test changed — this task's correctness rests on Task 1's tests plus the device check in Step 5.

- [ ] **Step 5: Verify on a device**

Jest cannot render this component and no simulator has LINE's in-app browser, so this step is manual and is not optional.

1. `npm run build && cp -r public .next/standalone/ && mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/ && PORT=3000 node .next/standalone/server.js`
2. Open the LIFF URL from LINE on a device where the app has not been opened recently (cold).
3. Read the overlay. Expected: `LiffPathHandler · status = done` on nav 2 lands within ~50ms of `client JS eval`, not after `liff.init() ✓`. Cold total should be around 2s, down from 6423ms.
4. Tap a plain `https://jbro.synqer.club/en/joined/...` link in a LINE chat. Expected: exactly one forward to `liff.line.me`, then the page. **A redirect loop here is the failure mode this task's session marker exists to prevent** — if the URL bounces, stop and fix before committing.
5. Sign out, then re-enter from LINE so the URL carries `?code=`. Expected: sign-in still completes.

- [ ] **Step 6: Commit (after user review)**

```bash
git add frontend/components/LiffPathHandler.tsx frontend/lib/liff.ts && git commit -m "perf(frontend): stop blocking the LIFF launch on liff.init()

On a document without liff.state the handler called initializeLiff() only to
read isInClient, then concluded it had nothing to do. Cold, that call took 4s
behind a full-screen spinner. The decision now comes from the URL, and the
forward-to-LIFF loop is closed by a session marker instead.

liff.init() is still awaited before navigating away from a LINE Login callback,
which is the one case that needs it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: Preconnect to the LIFF SDK's CDN

`liff.init()` fetches `ios-extensions_2_22_0.js` from `static.line-scdn.net`, measured at 1425ms cold. Task 2 stops that from blocking the render; this shortens it by starting the TLS handshake while the page's own JS is still downloading.

**Files:**
- Modify: `frontend/app/[locale]/layout.tsx`

- [ ] **Step 1: Add the resource hints**

In the returned JSX, immediately inside `<body>` and before `<ThemeProvider>`:

```tsx
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* liff.init() fetches its platform extensions from this host; the
            handshake costs ~1.4s cold, so start it alongside our own JS.
            React hoists these into <head>. */}
        <link rel="preconnect" href="https://static.line-scdn.net" />
        <link rel="dns-prefetch" href="https://static.line-scdn.net" />
        <ThemeProvider>
```

- [ ] **Step 2: Verify the tag reaches the served HTML**

React 19 hoists `<link>` elements, but hoisting is the thing being verified — check the actual bytes, not the source.

```bash
npm run build && cp -r public .next/standalone/ && mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/ && (PORT=3100 node .next/standalone/server.js &) && sleep 4 && curl -s http://localhost:3100/en/login | grep -o '<link rel="preconnect"[^>]*>'
```

Expected: `<link rel="preconnect" href="https://static.line-scdn.net"/>`

Then stop the server: `pkill -f "standalone/server.js"`

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npx eslint . && npx jest
```

- [ ] **Step 4: Commit (after user review)**

```bash
git add "frontend/app/[locale]/layout.tsx" && git commit -m "perf(frontend): preconnect to the LIFF SDK CDN

liff.init() pulls ios-extensions from static.line-scdn.net, measured at 1425ms
on a cold connection. Opening the connection early overlaps the handshake with
the page's own JS download.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: Serve the `liff.state` redirect from middleware

Removes the throwaway document entirely: no HTML, no bundle, no hydration for a page whose only job is `location.replace`. Worth the remaining ~740ms cold.

**Files:**
- Modify: `frontend/middleware.ts`

**Interfaces:**
- Consumes: `LIFF_ENTRY_COOKIE_NAME`, `resolveLiffStateServerRedirect` from `@/lib/liffEntry` (both defined in Task 1).

**Note on the entry URL:** LINE sends the user to the endpoint URL, which resolves to `/?liff.state=...`. next-intl's middleware redirects that to `/en?liff.state=...`, and only then is the locale known. `resolveLiffStateServerRedirect` therefore declines `/` and acts on the second pass. The redirect count is unchanged; the whole client document disappears.

- [ ] **Step 1: Add the redirect**

Replace the body of `middleware` in `frontend/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE_NAME, resolveLoginRedirect } from "./lib/auth-gate";
import {
  LIFF_ENTRY_COOKIE_NAME,
  resolveLiffStateServerRedirect,
} from "./lib/liffEntry";

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
    // LIFF launch, so it does not forward back to liff.line.me.
    response.cookies.set(LIFF_ENTRY_COOKIE_NAME, "1", {
      path: "/",
      sameSite: "lax",
    });
    return response;
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
```

- [ ] **Step 2: Verify the server redirect locally**

```bash
npm run build && cp -r public .next/standalone/ && mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/ && (PORT=3100 node .next/standalone/server.js &) && sleep 4 && curl -s -D - -o /dev/null "http://localhost:3100/en?liff.state=%2Fnew"
```

Expected: `HTTP/1.1 307`, `location: /en/new`, and a `set-cookie: synqer.liff-entry=1; Path=/; SameSite=Lax` header.

Then check the login callback is left alone:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3100/en?liff.state=%2Fnew&code=abc"
```

Expected: `200` — no redirect, so the client SDK still receives the code.

Then stop the server: `pkill -f "standalone/server.js"`

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit && npx eslint . && npx jest
```

- [ ] **Step 4: Verify on a device**

Open the LIFF URL from LINE. Expected in the overlay: **one** `━━ nav` section, not two. The trace should begin directly on `/en/new`.

- [ ] **Step 5: Commit (after user review)**

```bash
git add frontend/middleware.ts && git commit -m "perf(frontend): resolve the liff.state redirect in middleware

LINE opens the app at /{locale}?liff.state=/path. Serving that as a 307 skips a
full client document - HTML, bundle, hydration and a LIFF SDK load - whose only
outcome was window.location.replace.

The redirect sets a marker cookie so the destination knows it arrived from a
LIFF launch, and declines any URL carrying a login code so the SDK can still
consume it client-side.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: One `liff.init()` and one `getProfile()` per document

The cold trace ends with 5 `initializeLiff()` calls and 4 `getProfile()` calls; the warm trace spends its last 600ms on them, after the content is already interactive. Cause: five components call `useLiff()` directly instead of consuming `LiffProvider`, and each runs its own init effect.

**Files:**
- Modify: `frontend/lib/liff.ts` — promise caches for `initializeLiff` and `getLiffProfile`
- Test: `frontend/lib/liff.test.ts` (new)
- Modify: `frontend/components/CreateEventForm/GeneralSection.tsx:31`
- Modify: `frontend/components/CreateEventForm/hooks/useFormActions.ts:35`
- Modify: `frontend/components/Header/UserMenu.tsx:25`
- Modify: `frontend/components/CreateEventSuccessPage/index.tsx:37`
- Modify: `frontend/components/hostedEvent/HostedEventPanelPage/hooks/useHostedEventResultShare.ts:55`

All five render inside `LiffProvider` (`app/[locale]/layout.tsx:66`), so `useLiffContext()` is safe in every one.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/liff.test.ts`:

```ts
// The name must start with "mock" — jest.mock factories may not reference any
// other out-of-scope variable.
const mockLiff = {
  init: jest.fn().mockResolvedValue(undefined),
  isInClient: jest.fn().mockReturnValue(true),
  isLoggedIn: jest.fn().mockReturnValue(true),
  getProfile: jest.fn().mockResolvedValue({
    userId: "U1",
    displayName: "Tester",
    pictureUrl: "https://example.com/a.png",
  }),
};

jest.mock("@line/liff", () => ({ __esModule: true, default: mockLiff }));

describe("initializeLiff", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_LINE_LIFF_ID = "test-liff-id";
  });

  it("runs liff.init() once for concurrent callers", async () => {
    const { initializeLiff } = await import("@/lib/liff");

    const states = await Promise.all([
      initializeLiff(),
      initializeLiff(),
      initializeLiff(),
    ]);

    expect(mockLiff.init).toHaveBeenCalledTimes(1);
    states.forEach((state) => expect(state.isInitialized).toBe(true));
  });

  it("runs liff.init() once for sequential callers", async () => {
    const { initializeLiff } = await import("@/lib/liff");

    await initializeLiff();
    await initializeLiff();

    expect(mockLiff.init).toHaveBeenCalledTimes(1);
  });

  it("fetches the profile once per document", async () => {
    const { getLiffProfile } = await import("@/lib/liff");

    const profiles = await Promise.all([getLiffProfile(), getLiffProfile()]);

    expect(mockLiff.getProfile).toHaveBeenCalledTimes(1);
    expect(profiles[0]).toEqual(profiles[1]);
    expect(profiles[0]?.displayName).toBe("Tester");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest lib/liff.test.ts`
Expected: FAIL — `expect(mockLiff.init).toHaveBeenCalledTimes(1)` receives 3.

- [ ] **Step 3: Add the caches in `lib/liff.ts`**

Next to the existing `liffObject` declaration:

```ts
// One document only ever needs one init and one profile. Without this, every
// component that calls useLiff() pays a separate round trip to LINE.
let initPromise: Promise<LiffState> | null = null;
let profilePromise: Promise<LiffProfile | null> | null = null;
```

Move the current body of `initializeLiff` verbatim into a new private `runInitializeLiff` — every line, including the `perfMark` counter and the `try/catch` — and export a wrapper under the original name:

```ts
/**
 * Initialize LIFF.
 *
 * Deduplicated per document: the returned state is a snapshot of isInClient /
 * isLoggedIn, and both only change by navigating, which discards this module.
 *
 * @returns The LIFF initialization state
 */
export function initializeLiff(): Promise<LiffState> {
  initPromise ??= runInitializeLiff();
  return initPromise;
}

async function runInitializeLiff(): Promise<LiffState> {
  // ... existing body, unchanged ...
}
```

Do the same for the profile — move the current body of `getLiffProfile` verbatim into `runGetLiffProfile`:

```ts
/**
 * Get the LIFF profile
 */
export function getLiffProfile(): Promise<LiffProfile | null> {
  profilePromise ??= runGetLiffProfile();
  return profilePromise;
}

async function runGetLiffProfile(): Promise<LiffProfile | null> {
  // ... existing body, unchanged ...
}
```

Note that a failed init is cached too. That is intentional: it fails the same way for every caller in a document, and `useAuth` already guards its own retry with `liffAttemptedRef`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest lib/liff.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Point the five components at the shared context**

In each file, replace the import and the call. Import:

```ts
import { useLiffContext } from "@/contexts/LiffContext";
```

Call sites, one per file:

- `components/CreateEventForm/GeneralSection.tsx:31` — `const { isInClient: isInLiff } = useLiffContext();`
- `components/CreateEventForm/hooks/useFormActions.ts:35` — `const { isInClient: isInLiff, closeWindow } = useLiffContext();`
- `components/Header/UserMenu.tsx:25` — `const { isInClient: isInLiff } = useLiffContext();`
- `components/CreateEventSuccessPage/index.tsx:37` — `const { isInClient: isInLiff, isInitialized: liffInitialized } = useLiffContext();`
- `components/hostedEvent/HostedEventPanelPage/hooks/useHostedEventResultShare.ts:55` — `const { isInClient: isInLiffClient, isInitialized: isLiffInitialized } = useLiffContext();`

Delete the now-unused `import { useLiff } from "@/hooks/useLiff";` from each.

- [ ] **Step 6: Confirm `useLiff` has exactly one caller left**

Run:

```bash
grep -rn "useLiff()" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules | grep -v "hooks/useLiff.ts"
```

Expected: one line, `contexts/LiffContext.tsx:39`.

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit && npx eslint . && npx jest
```

- [ ] **Step 8: Verify on a device**

Open from LINE and read the overlay. Expected: `initializeLiff() call #1` and `#2` only (LiffPathHandler's login-callback path plus the provider), one `getProfile()`, and no LIFF marks after the last `api ⇠` line.

Then exercise what these components use the flag for: on `/new` the LINE group section and the submit button's close-window behaviour, and the LINE share button on a hosted event's result page.

- [ ] **Step 9: Commit (after user review)**

```bash
git add frontend/lib/liff.ts frontend/lib/liff.test.ts frontend/components && git commit -m "perf(frontend): share one LIFF init and profile per document

Five components called useLiff() directly instead of consuming LiffProvider, so
a single page ran liff.init() five times and getProfile() four times. Cold, that
was 720ms of LINE round trips after the content was already interactive.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: Re-measure, then remove the instrumentation

**Files:**
- Delete: `frontend/lib/perfTrace.ts`, `frontend/components/PerfTraceOverlay.tsx`
- Modify: `frontend/app/[locale]/layout.tsx`, `frontend/components/LiffPathHandler.tsx`, `frontend/hooks/useAuth.ts`, `frontend/hooks/useLiff.ts`, `frontend/lib/apiClient.ts`, `frontend/lib/liff.ts`

- [ ] **Step 1: Capture the final numbers**

Build and serve the production bundle, then open from LINE once cold and once warm. Copy both traces from the overlay.

Compare against the baseline recorded at the top of this plan: cold 6423ms, warm 1824ms. Record the new figures in the PR description.

If cold is still above ~2.5s, do not proceed to Step 2 — the trace is the only tool for finding out why, and removing it first means re-adding it.

- [ ] **Step 2: Remove the instrumentation**

```bash
git rm frontend/lib/perfTrace.ts frontend/components/PerfTraceOverlay.tsx
```

Then strip every `perfMark` / `perfSpan` call and its import from the six modified files. `git log --oneline` will show the Task 0 commit; `git show <sha>` is the authoritative list of what to undo. Restore each `log()` helper to its original single-line `debugLog` form:

```ts
const log = (message: string, data?: unknown) =>
  debugLog("useLiff", message, data);
```

In `lib/apiClient.ts`, restore `apiFetch` to its original body:

```ts
export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(toApiUrl(path), {
    ...init,
    credentials: init?.credentials ?? "include",
  });
}
```

In `lib/liff.ts`, also remove the `initializeLiffCalls` counter.

- [ ] **Step 3: Confirm nothing references the removed module**

```bash
grep -rn "perfTrace\|perfMark\|perfSpan\|PerfTraceOverlay" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules
```

Expected: no output.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npx eslint . && npx jest && npm run build
```

- [ ] **Step 5: Commit (after user review)**

```bash
git add -A && git commit -m "chore(frontend): remove the temporary LIFF load-time instrumentation

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Open the PR**

English, no emojis, no testing section. Lead with the before/after numbers from Step 1.

---

## Expected outcome

| | baseline cold | baseline warm | after |
|---|---|---|---|
| Total wall time | 6423ms | 1824ms | ~1.5s cold, ~0.9s warm |
| Documents loaded | 2 | 2 | 1 |
| `liff.init()` calls | 5 | 5 | 1 |
| Blocking spinner | 4067ms | 101ms | one frame |

Task 2 alone accounts for roughly 4.0s of the cold saving; Tasks 3–5 split the remaining ~1.5s. Task 2 is independently shippable and is the one to land first if the rest slips.

## Risks

- **Redirect loop between our origin and `liff.line.me`.** The `isInClient` check that Task 2 removes was what prevented it. Two independent markers replace it — the sessionStorage entry (Task 2) and the cookie (Task 4) — and Task 2 Step 5.4 tests it explicitly. This is the failure mode to watch for.
- **`isInClient` is briefly `false`** on first paint for the five components in Task 5, because nothing blocks on the SDK any more. That was already true for four of them; verify the LINE group section on `/new` and the share buttons do not flash into the wrong state. If one does, give it a skeleton keyed on `isLoading` from the context rather than reinstating a blocking init.
- **The marker cookie outlives the launch.** `synqer.liff-entry` has no expiry, so it lives for the browser session. A plain chat link opened later in the same LINE webview session will not be forwarded into LIFF, and will run without LIFF APIs. Acceptable, and reversible by scoping the cookie to a short `maxAge` if it turns out to matter.
