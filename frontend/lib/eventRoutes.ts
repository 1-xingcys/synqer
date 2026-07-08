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

export function eventDetailPath(eventId: string, tab?: DetailTab): string {
  return tab
    ? `${UNIFIED_EVENT_BASE}/${eventId}/${tab}`
    : `${UNIFIED_EVENT_BASE}/${eventId}`;
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
