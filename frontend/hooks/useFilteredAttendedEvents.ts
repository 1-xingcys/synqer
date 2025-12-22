import { useMemo } from "react";
import { EventStatus, AttendedEventListItem } from "@/types/event";
import { EventRowHost } from "@/components/eventCommon/EventsOverview";

export interface ExtendedAttendedEvent extends AttendedEventListItem {
  host?: EventRowHost | null;
  expectedParticipantCount?: number;
  votedCount?: number;
}

type EventCategory = "voting" | "votingEnded" | "confirmed" | "completed";

interface FilteredEvents {
  voting: ExtendedAttendedEvent[];
  votingEnded: ExtendedAttendedEvent[];
  confirmed: ExtendedAttendedEvent[];
  completed: ExtendedAttendedEvent[];
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
  events: ExtendedAttendedEvent[],
  category: EventCategory,
): ExtendedAttendedEvent[] {
  const now = new Date().getTime();

  return [...events].sort((a, b) => {
    switch (category) {
      case "voting": {
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

      case "votingEnded": {
        // By start date (closer to now = higher priority)
        const startA = new Date(a.startDate).getTime();
        const startB = new Date(b.startDate).getTime();
        return Math.abs(startA - now) - Math.abs(startB - now);
      }

      case "confirmed": {
        // By start date (closer to now = higher priority)
        const startA = new Date(a.startDate).getTime();
        const startB = new Date(b.startDate).getTime();
        return Math.abs(startA - now) - Math.abs(startB - now);
      }

      case "completed": {
        // By end date (closer to now = higher priority)
        const endA = new Date(a.endDate).getTime();
        const endB = new Date(b.endDate).getTime();
        return Math.abs(endA - now) - Math.abs(endB - now);
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
  events: ExtendedAttendedEvent[],
): FilteredEvents {
  return useMemo(() => {
    const filtered: FilteredEvents = {
      voting: [],
      votingEnded: [],
      confirmed: [],
      completed: [],
    };

    // Categorize events by status
    events.forEach((event) => {
      switch (event.status) {
        case EventStatus.VOTING:
          filtered.voting.push(event);
          break;
        case EventStatus.VOTING_ENDED:
          filtered.votingEnded.push(event);
          break;
        case EventStatus.CONFIRMED:
          filtered.confirmed.push(event);
          break;
        case EventStatus.COMPLETED:
          filtered.completed.push(event);
          break;
      }
    });

    // Sort each category
    return {
      voting: sortEvents(filtered.voting, "voting"),
      votingEnded: sortEvents(filtered.votingEnded, "votingEnded"),
      confirmed: sortEvents(filtered.confirmed, "confirmed"),
      completed: sortEvents(filtered.completed, "completed"),
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
