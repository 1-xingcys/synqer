/**
 * LINE LIFF initialization and helper functions.
 *
 * LIFF (LINE Front-end Framework) lets a web app run inside LINE and read the
 * user's LINE profile information.
 */

import { matchesLineUserAgent } from "@/lib/routing/auth-gate";

// The LIFF SDK is loaded dynamically on the client
let liffObject: typeof import("@line/liff").default | null = null;

// One document only ever needs one init and one profile. Without this, every
// component that calls useLiff() pays a separate round trip to LINE.
let initPromise: Promise<LiffState> | null = null;
let profilePromise: Promise<LiffProfile | null> | null = null;

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
 * Initialize LIFF.
 *
 * Deduplicated per document: the returned state is a snapshot of isInClient /
 * isLoggedIn, and both only change by navigating, which discards this module.
 * A failed init is cached too — it fails the same way for every caller in a
 * document, and useAuth already guards its own retry with liffAttemptedRef.
 *
 * @returns The LIFF initialization state
 */
export function initializeLiff(): Promise<LiffState> {
  initPromise ??= runInitializeLiff();
  return initPromise;
}

async function runInitializeLiff(): Promise<LiffState> {
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
 * Get the LIFF profile.
 *
 * Deduplicated per document for the same reason as initializeLiff: it is a
 * network round trip to LINE and the answer cannot change without a navigation.
 */
export function getLiffProfile(): Promise<LiffProfile | null> {
  profilePromise ??= runGetLiffProfile();
  return profilePromise;
}

async function runGetLiffProfile(): Promise<LiffProfile | null> {
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
