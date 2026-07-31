/**
 * LINE LIFF initialization and helper functions.
 *
 * LIFF (LINE Front-end Framework) lets a web app run inside LINE and read the
 * user's LINE profile information.
 */

import { LOCALES } from "@/i18n/locales";
import { matchesLineUserAgent } from "@/lib/auth-gate";

// The LIFF SDK is loaded dynamically on the client
let liffObject: typeof import("@line/liff").default | null = null;

/**
 * LIFF initialization state
 */
export interface LiffState {
  isInitialized: boolean;
  isInClient: boolean; // Whether the page is open inside the LINE app
  isLoggedIn: boolean;
  error: Error | null;
}

/**
 * LIFF profile information
 */
export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LIFF context types
 */
export const LiffContextType = {
  Utou: "utou",
  Room: "room",
  Group: "group",
  None: "none",
  External: "external",
  SquareChat: "square_chat",
} as const;
export type LiffContextType =
  (typeof LiffContextType)[keyof typeof LiffContextType];

/**
 * LIFF view types
 */
export const LiffViewType = {
  Full: "full",
  Tall: "tall",
  Compact: "compact",
  Frame: "frame",
  FullFlex: "full-flex",
} as const;
export type LiffViewType = (typeof LiffViewType)[keyof typeof LiffViewType];

/**
 * LIFF context information
 */
export interface LiffContext {
  type: LiffContextType;
  viewType?: LiffViewType;
  userId?: string;
  utouId?: string;
  roomId?: string;
  groupId?: string;
}

/**
 * Get the LIFF ID
 */
export function getLiffId(): string {
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
  if (!liffId) {
    console.warn("NEXT_PUBLIC_LINE_LIFF_ID is not set");
    return "";
  }
  return liffId;
}

/**
 * Check whether this is a LIFF environment (a LIFF ID is configured)
 */
export function isLiffEnabled(): boolean {
  return !!getLiffId();
}

/**
 * Check whether we are currently in the LINE app's in-app browser
 */
export function isLineUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return matchesLineUserAgent(navigator.userAgent);
}

/**
 * Build the LIFF entry URL for the current page
 */
export function buildLiffEntryUrl(currentUrl?: string): string | null {
  const liffId = getLiffId();
  if (!liffId) return null;

  const sourceUrl =
    currentUrl ?? (typeof window !== "undefined" ? window.location.href : "");
  if (!sourceUrl) return null;

  try {
    const url = new URL(sourceUrl);

    // Already a LIFF launch callback, no need to forward again
    if (url.searchParams.has("liff.state")) {
      return null;
    }

    return `https://liff.line.me/${liffId}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Dynamically load the LIFF SDK
 */
async function loadLiffSdk(): Promise<typeof import("@line/liff").default> {
  if (liffObject) {
    return liffObject;
  }

  try {
    const liff = (await import("@line/liff")).default;
    liffObject = liff;
    return liff;
  } catch (error) {
    console.error("Failed to load LIFF SDK:", error);
    throw new Error("Failed to load LIFF SDK");
  }
}

/**
 * Read the path carried by the liff.state parameter in the URL.
 * When opened as https://liff.line.me/{liffId}/{path}, LINE stores {path} in
 * the liff.state query parameter.
 */
export function getLiffStatePath(): string | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const liffState = url.searchParams.get("liff.state");

  if (!liffState) return null;

  // liff.state may be a URL-encoded path
  try {
    const decodedState = decodeURIComponent(liffState);
    // Make sure it is a path (starts with /)
    if (decodedState.startsWith("/")) {
      return decodedState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Handle the LIFF path redirect.
 * If the URL carries a liff.state parameter containing a path, redirect there.
 * @returns The target path when a redirect is needed, otherwise null
 */
export function handleLiffPathRedirect(): string | null {
  const liffPath = getLiffStatePath();

  if (!liffPath) return null;

  // Read the current pathname
  const currentPathname = window.location.pathname;

  const localePattern = new RegExp(`^/(${LOCALES.join("|")})`);

  // Check whether the path is only a locale prefix (e.g. /zh-TW or /en)
  const localeOnlyPattern = /^\/[a-z]{2}(-[A-Z]{2})?\/?$/;
  const isOnRootWithLocale = localeOnlyPattern.test(currentPathname);

  // Redirect when we are on the root path (or only a locale) and liff.state
  // points somewhere else
  if (isOnRootWithLocale || currentPathname === "/") {
    // Check whether liffPath already carries a locale prefix
    const liffPathHasLocale = localePattern.test(liffPath);

    if (liffPathHasLocale) {
      // liff.state already includes the locale, use it as-is
      return liffPath;
    }

    // liff.state has no locale, so prepend the current one
    const localeMatch = currentPathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)/);
    const locale = localeMatch ? localeMatch[1] : "";

    // Build the target path
    const targetPath = locale ? `/${locale}${liffPath}` : liffPath;

    return targetPath;
  }

  return null;
}

/**
 * Initialize LIFF
 *
 * @returns The LIFF initialization state
 */
export async function initializeLiff(): Promise<LiffState> {
  const liffId = getLiffId();

  if (!liffId) {
    return {
      isInitialized: false,
      isInClient: false,
      isLoggedIn: false,
      error: new Error("LIFF ID is not configured"),
    };
  }

  try {
    const liff = await loadLiffSdk();

    await liff.init({
      liffId,
      // Do not log in automatically when opened in an external browser
      withLoginOnExternalBrowser: false,
    });

    return {
      isInitialized: true,
      isInClient: liff.isInClient(),
      isLoggedIn: liff.isLoggedIn(),
      error: null,
    };
  } catch (error) {
    console.error("LIFF initialization failed:", error);
    return {
      isInitialized: false,
      isInClient: false,
      isLoggedIn: false,
      error: error instanceof Error ? error : new Error("LIFF init failed"),
    };
  }
}

/**
 * Get the LIFF object (it must be initialized first)
 */
export async function getLiff(): Promise<
  typeof import("@line/liff").default | null
> {
  if (!isLiffEnabled()) {
    return null;
  }

  try {
    return await loadLiffSdk();
  } catch {
    return null;
  }
}

/**
 * Get the LIFF access token.
 * Can be used by the backend to verify the user's identity.
 */
export async function getLiffAccessToken(): Promise<string | null> {
  const liff = await getLiff();
  if (!liff || !liff.isLoggedIn()) {
    return null;
  }

  try {
    return liff.getAccessToken();
  } catch (error) {
    console.error("Failed to get LIFF access token:", error);
    return null;
  }
}

/**
 * Get the LIFF profile
 */
export async function getLiffProfile(): Promise<LiffProfile | null> {
  const liff = await getLiff();
  if (!liff || !liff.isLoggedIn()) {
    return null;
  }

  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch (error) {
    console.error("Failed to get LIFF profile:", error);
    return null;
  }
}

/**
 * Get the LIFF context.
 * Includes where the app was opened from (1:1 chat, group, and so on).
 */
export async function getLiffContext(): Promise<LiffContext | null> {
  const liff = await getLiff();
  if (!liff) {
    return null;
  }

  try {
    const context = liff.getContext();
    if (!context) {
      return { type: LiffContextType.External };
    }

    return {
      type: context.type as LiffContextType,
      viewType: context.viewType as LiffViewType | undefined,
      userId: context.userId,
      utouId: context.utouId,
      roomId: context.roomId,
      groupId: context.groupId,
    };
  } catch (error) {
    console.error("Failed to get LIFF context:", error);
    return null;
  }
}

/**
 * Log in inside the LINE app.
 * Only needs to be called when inside LIFF but not logged in.
 */
export async function liffLogin(redirectUri?: string): Promise<void> {
  const liff = await getLiff();
  if (!liff) {
    console.warn("LIFF is not available");
    return;
  }

  if (liff.isLoggedIn()) {
    return;
  }

  liff.login({
    redirectUri: redirectUri || window.location.href,
  });
}

/**
 * Log out of LIFF
 */
export async function liffLogout(): Promise<void> {
  const liff = await getLiff();
  if (!liff) {
    return;
  }

  if (liff.isLoggedIn()) {
    liff.logout();
  }
}

/**
 * Close the LIFF window.
 * Only has an effect when opened inside the LINE app.
 */
export async function closeLiff(): Promise<void> {
  const liff = await getLiff();
  if (!liff || !liff.isInClient()) {
    return;
  }

  liff.closeWindow();
}

/**
 * Check whether we are running inside the LINE app
 */
export async function isInLineClient(): Promise<boolean> {
  const liff = await getLiff();
  return liff?.isInClient() ?? false;
}
