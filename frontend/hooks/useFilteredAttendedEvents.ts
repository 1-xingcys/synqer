import { useMemo } from "react";
import { EventStatus } from "@/types/event";
import type { AttendedEventApiItem } from "./useAttendedEvents";
import {
  getEventConfirmedEndTime,
  getEventConfirmedStartTime,
} from "@/lib/event-presentation";

interface FilteredEvents {
  [EventStatus.VOTING]: AttendedEventApiItem[];
  [EventStatus.VOTING_ENDED]: AttendedEventApiItem[];
  [EventStatus.CONFIRMED]: AttendedEventApiItem[];
  [EventStatus.COMPLETED]: AttendedEventApiItem[];
}

/**
 * Sort events based on the category's ordering rules
 *
 * Voting: Unvoted first, then by deadline (closer = higher priority)
 * Voting Ended: By start date (closer = higher priority)
 * Confirmed: By confirmed start date (closer = higher priority)
 * Completed: By confirmed end date (closer = higher priority)
 */
function sortEvents(
  events: AttendedEventApiItem[],
  category: EventStatus,
): AttendedEventApiItem[] {
  const now = new Date().getTime();

  return [...events].sort((a, b) => {
    switch (category) {
      case EventStatus.VOTING: {
        // Unvoted first
        if (a.hasVoted !== b.hasVoted) {
          return a.hasVoted ? 1 : -1;
        }
        // Then by deadline (closer to now = higher priority)
        const deadlineA = a.votingDeadline
          ? new Date(a.votingDeadline).getTime()
          : Infinity;
        const deadlineB = b.votingDeadline
          ? new Date(b.votingDeadline).getTime()
          : Infinity;
        // Closer deadline = smaller difference from now = higher priority
        return Math.abs(deadlineA - now) - Math.abs(deadlineB - now);
      }

      case EventStatus.VOTING_ENDED: {
        // By start date (closer to now = higher priority)
        const startA = new Date(a.startDate).getTime();
        const startB = new Date(b.startDate).getTime();
        return Math.abs(startA - now) - Math.abs(startB - now);
      }

      case EventStatus.CONFIRMED: {
        return (
          Math.abs(getEventConfirmedStartTime(a) - now) -
          Math.abs(getEventConfirmedStartTime(b) - now)
        );
      }

      case EventStatus.COMPLETED: {
        return (
          Math.abs(getEventConfirmedEndTime(a) - now) -
          Math.abs(getEventConfirmedEndTime(b) - now)
        );
      }

      default:
        return 0;
    }
  });
}

/**
 * Hook to filter and sort attended events by status
 */
export function useFilteredAttendedEvents(
  events: AttendedEventApiItem[],
): FilteredEvents {
  return useMemo(() => {
    const filtered: FilteredEvents = {
      [EventStatus.VOTING]: [],
      [EventStatus.VOTING_ENDED]: [],
      [EventStatus.CONFIRMED]: [],
      [EventStatus.COMPLETED]: [],
    };

    // Categorize events by status
    events.forEach((event) => {
      switch (event.status) {
        case EventStatus.VOTING:
          filtered[EventStatus.VOTING].push(event);
          break;
        case EventStatus.VOTING_ENDED:
          filtered[EventStatus.VOTING_ENDED].push(event);
          break;
        case EventStatus.CONFIRMED:
          filtered[EventStatus.CONFIRMED].push(event);
          break;
        case EventStatus.COMPLETED:
          filtered[EventStatus.COMPLETED].push(event);
          break;
      }
    });

    // Sort each category
    return {
      [EventStatus.VOTING]: sortEvents(
        filtered[EventStatus.VOTING],
        EventStatus.VOTING,
      ),
      [EventStatus.VOTING_ENDED]: sortEvents(
        filtered[EventStatus.VOTING_ENDED],
        EventStatus.VOTING_ENDED,
      ),
      [EventStatus.CONFIRMED]: sortEvents(
        filtered[EventStatus.CONFIRMED],
        EventStatus.CONFIRMED,
      ),
      [EventStatus.COMPLETED]: sortEvents(
        filtered[EventStatus.COMPLETED],
        EventStatus.COMPLETED,
      ),
    };
  }, [events]);
}

/**
 * Paginate events
 */
export function paginateEvents<T>(
  events: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number; totalItems: number } {
  const totalItems = events.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const items = events.slice(startIndex, startIndex + pageSize);

  return { items, totalPages, totalItems };
}
