import { EventStatus } from "@/types/event";

/**
 * Semantic text color per event status. Single source of truth shared by
 * EventStatusText (status label) and EventRow (status icon) so the two never
 * drift apart.
 */
export const eventStatusColor: Record<EventStatus, string> = {
  [EventStatus.VOTING]: "text-blue-600 dark:text-blue-400",
  [EventStatus.VOTING_ENDED]: "text-amber-600 dark:text-amber-400",
  [EventStatus.CONFIRMED]: "text-green-600 dark:text-green-400",
  [EventStatus.COMPLETED]: "text-zinc-500 dark:text-zinc-400",
};
