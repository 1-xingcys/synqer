/**
 * Sidebar 開闔狀態的推導規則。
 *
 * `null` 代表「使用者還沒手動開關過」。這個狀態刻意不去讀 window —— 預設外觀
 * （手機收合、桌面展開）完全交給 Tailwind 的 lg: 斷點處理，server 與 client
 * 的第一次渲染因此必定一致，不會有 hydration mismatch，也不會有先畫錯再修正
 * 的閃動。使用者一旦點過開關，狀態就變成明確的 true / false。
 */
export type SidebarOpenState = boolean | null;

export interface SidebarPresentation {
  /** 展開時 SidebarItem 只顯示圖示 */
  isCollapsed: boolean;
  /** 手機版的半透明遮罩，只有真的展開時才需要 */
  showOverlay: boolean;
  visibilityClass: string;
  widthClass: string;
}

const VISIBLE = "translate-x-0 opacity-100 pointer-events-auto";

// 收合時手機完全移出畫面，桌面仍靠 lg: 覆寫維持可見。
const HIDDEN_ON_MOBILE_ONLY =
  "-translate-x-full opacity-0 pointer-events-none " +
  "lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto";

export function resolveSidebarPresentation(
  isOpen: SidebarOpenState,
): SidebarPresentation {
  return {
    // null 不算收合：桌面要展開，手機根本看不到，兩邊都應該顯示標籤
    isCollapsed: isOpen === false,
    showOverlay: isOpen === true,
    visibilityClass: isOpen === true ? VISIBLE : HIDDEN_ON_MOBILE_ONLY,
    widthClass: isOpen === false ? "lg:w-20" : "lg:w-64",
  };
}

/**
 * 從未操作過的狀態按下開關時要往哪個方向走。
 *
 * 手機的預設是收合，所以要打開；桌面的預設是展開，所以要收合。只在使用者
 * 互動時呼叫，此時讀取視窗寬度是安全的。
 */
export function nextSidebarOpenState(
  isOpen: SidebarOpenState,
  isDesktop: boolean,
): boolean {
  return isOpen === null ? !isDesktop : !isOpen;
}

/**
 * 是否要對輔助技術隱藏。
 *
 * 桌面版永遠在無障礙樹上；手機版只有展開時才是。掛載前一律當作手機，
 * 螢幕閱讀器本來就在 hydration 之後才讀取。
 */
export function isHiddenFromAssistiveTech(
  isOpen: SidebarOpenState,
  isDesktop: boolean,
): boolean {
  return !isDesktop && isOpen !== true;
}
