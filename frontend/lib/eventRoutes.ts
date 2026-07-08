import { EventStatus } from "@/types/event";

/**
 * 統一活動頁的路由基底（佔位命名，日後改名只需改這裡 + 資料夾名）。
 */
export const UNIFIED_EVENT_BASE = "/e";

export type OverviewStatus =
  | "voting"
  | "voting-ended"
  | "confirmed"
  | "completed";

export type DetailTab = "vote" | "results" | "participants" | "settings";

export function eventOverviewPath(status: OverviewStatus): string {
  return `${UNIFIED_EVENT_BASE}/${status}`;
}

/**
 * 登入 / 建立活動 / 返回清單的預設落點（最活躍的清單）。
 * 單一真相，避免各處散落 "/e/voting" 字面值。
 */
export const DEFAULT_OVERVIEW_PATH = eventOverviewPath("voting");

export function eventDetailPath(eventId: string, tab?: DetailTab): string {
  return tab
    ? `${UNIFIED_EVENT_BASE}/${eventId}/${tab}`
    : `${UNIFIED_EVENT_BASE}/${eventId}`;
}

/** 舊 overview 連結（/joined, /hosted）導向統一清單。 */
export function legacyOverviewRedirect(status?: OverviewStatus): string {
  return status ? eventOverviewPath(status) : DEFAULT_OVERVIEW_PATH;
}

/** 舊 detail 連結（/joined, /hosted, /events）導向統一活動頁。 */
export function legacyDetailRedirect(eventId: string, tab?: DetailTab): string {
  return eventDetailPath(eventId, tab);
}

/** 把 OverviewStatus 對應回 EventStatus 常數，供清單過濾。 */
export function eventStatusForOverview(status: OverviewStatus): EventStatus {
  switch (status) {
    case "voting":
      return EventStatus.VOTING;
    case "voting-ended":
      return EventStatus.VOTING_ENDED;
    case "confirmed":
      return EventStatus.CONFIRMED;
    case "completed":
      return EventStatus.COMPLETED;
  }
}

export function overviewStatusForEventStatus(
  status: EventStatus,
): OverviewStatus {
  switch (status) {
    case EventStatus.VOTING_ENDED:
      return "voting-ended";
    case EventStatus.CONFIRMED:
      return "confirmed";
    case EventStatus.COMPLETED:
      return "completed";
    case EventStatus.VOTING:
    default:
      return "voting";
  }
}
