/**
 * LINE LIFF 初始化與工具函數
 *
 * LIFF (LINE Front-end Framework) 允許網頁應用程式在 LINE 內運行
 * 並取得使用者的 LINE Profile 資訊
 */

// LIFF SDK 會在客戶端動態載入
let liffObject: typeof import("@line/liff").default | null = null;

/**
 * LIFF 初始化狀態
 */
export interface LiffState {
  isInitialized: boolean;
  isInClient: boolean; // 是否在 LINE App 內開啟
  isLoggedIn: boolean;
  error: Error | null;
}

/**
 * LIFF Profile 資訊
 */
export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * LIFF Context 類型
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
 * LIFF View 類型
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
 * LIFF Context 資訊
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
 * 取得 LIFF ID
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
 * 檢查是否為 LIFF 環境（有設定 LIFF ID）
 */
export function isLiffEnabled(): boolean {
  return !!getLiffId();
}

/**
 * 動態載入 LIFF SDK
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
 * 從 URL 中取得 liff.state 參數中的路徑
 * 當使用 https://liff.line.me/{liffId}/{path} 格式時，
 * LINE 會把 {path} 存在 liff.state query parameter 中
 */
export function getLiffStatePath(): string | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const liffState = url.searchParams.get("liff.state");

  if (!liffState) return null;

  // liff.state 可能是 URL 編碼的路徑
  try {
    const decodedState = decodeURIComponent(liffState);
    // 確保是一個路徑（以 / 開頭）
    if (decodedState.startsWith("/")) {
      return decodedState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 處理 LIFF 路徑重定向
 * 如果 URL 中有 liff.state 參數且包含路徑，就重定向到該路徑
 * @returns 如果需要重定向，返回目標路徑；否則返回 null
 */
export function handleLiffPathRedirect(): string | null {
  const liffPath = getLiffStatePath();

  if (!liffPath) return null;

  // 取得目前的 pathname
  const currentPathname = window.location.pathname;

  // 支持的 locales
  const locales = ["en", "zh-TW"];
  const localePattern = new RegExp(`^/(${locales.join("|")})`);

  // 檢查是否只有 locale 前綴（例如 /zh-TW 或 /en）
  const localeOnlyPattern = /^\/[a-z]{2}(-[A-Z]{2})?\/?$/;
  const isOnRootWithLocale = localeOnlyPattern.test(currentPathname);

  // 如果目前在根路徑（或只有 locale）且 liff.state 有其他路徑，需要重定向
  if (isOnRootWithLocale || currentPathname === "/") {
    // 檢查 liffPath 是否已經包含 locale 前綴
    const liffPathHasLocale = localePattern.test(liffPath);

    if (liffPathHasLocale) {
      // liff.state 已經包含 locale，直接使用
      return liffPath;
    }

    // liff.state 不包含 locale，需要加上當前的 locale
    const localeMatch = currentPathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)/);
    const locale = localeMatch ? localeMatch[1] : "";

    // 建立目標路徑
    const targetPath = locale ? `/${locale}${liffPath}` : liffPath;

    return targetPath;
  }

  return null;
}

/**
 * 初始化 LIFF
 *
 * @returns LIFF 初始化狀態
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
      // 在外部瀏覽器開啟時，不自動登入
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
 * 取得 LIFF 物件（必須先初始化）
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
 * 取得 LIFF Access Token
 * 可用於後端驗證使用者身份
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
 * 取得 LIFF ID Token
 * 包含使用者資訊的 JWT
 */
export async function getLiffIdToken(): Promise<string | null> {
  const liff = await getLiff();
  if (!liff || !liff.isLoggedIn()) {
    return null;
  }

  try {
    return liff.getIDToken();
  } catch (error) {
    console.error("Failed to get LIFF ID token:", error);
    return null;
  }
}

/**
 * 取得 LIFF Profile
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
 * 取得 LIFF Context
 * 包含開啟來源（1:1 聊天、群組等）
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
 * 在 LINE App 內登入
 * 只有在 LIFF 內但未登入時才需要呼叫
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
 * LIFF 登出
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
 * 關閉 LIFF 視窗
 * 只有在 LINE App 內開啟時才有效
 */
export async function closeLiff(): Promise<void> {
  const liff = await getLiff();
  if (!liff || !liff.isInClient()) {
    return;
  }

  liff.closeWindow();
}

/**
 * 在外部瀏覽器開啟連結
 */
export async function openExternalBrowser(url: string): Promise<void> {
  const liff = await getLiff();
  if (liff && liff.isInClient()) {
    liff.openWindow({
      url,
      external: true,
    });
  } else {
    window.open(url, "_blank");
  }
}

/**
 * 分享訊息到聊天室（只有在 LINE App 內才能使用）
 */
export async function shareMessage(text: string): Promise<boolean> {
  const liff = await getLiff();
  if (!liff || !liff.isInClient()) {
    return false;
  }

  try {
    await liff.shareTargetPicker([
      {
        type: "text",
        text,
      },
    ]);
    return true;
  } catch (error) {
    console.error("Failed to share message:", error);
    return false;
  }
}

/**
 * 檢查是否在 LINE App 內運行
 */
export async function isInLineClient(): Promise<boolean> {
  const liff = await getLiff();
  return liff?.isInClient() ?? false;
}

/**
 * 檢查 LIFF 是否已登入
 */
export async function isLiffLoggedIn(): Promise<boolean> {
  const liff = await getLiff();
  return liff?.isLoggedIn() ?? false;
}
