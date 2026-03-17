import { useMemo } from "react";
import { EventStatus } from "@/types/event";
import { HostedEventApiItem } from "./useHostedEvents";
import {
  getEventConfirmedEndTime,
  getEventConfirmedStartTime,
} from "@/lib/event-presentation";

interface FilteredHostedEvents {
  [EventStatus.VOTING]: HostedEventApiItem[];
  [EventStatus.VOTING_ENDED]: HostedEventApiItem[];
  [EventStatus.CONFIRMED]: HostedEventApiItem[];
  [EventStatus.COMPLETED]: HostedEventApiItem[];
}

/**
 * Sort hosted events based on the category's ordering rules
 *
 * Voting: Unvoted first (events where not everyone has voted), then by deadline (closer = higher priority)
 * Voting Ended: By start date (closer = higher priority)
 * Confirmed: By confirmed start date (closer = higher priority)
 * Completed: By confirmed end date (closer = higher priority)
 */
function sortHostedEvents(
  events: HostedEventApiItem[],
  category: EventStatus,
): HostedEventApiItem[] {
  const now = new Date().getTime();

  return [...events].sort((a, b) => {
    switch (category) {
      case EventStatus.VOTING: {
        // Events where not everyone has voted come first
        const aAllVoted = (a.votedCount ?? 0) >= a.expectedParticipantCount;
        const bAllVoted = (b.votedCount ?? 0) >= b.expectedParticipantCount;
        if (aAllVoted !== bAllVoted) {
          return aAllVoted ? 1 : -1;
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
        // By confirmed start date (closer to now = higher priority)
        return (
          Math.abs(getEventConfirmedStartTime(a) - now) -
          Math.abs(getEventConfirmedStartTime(b) - now)
        );
      }

      case EventStatus.COMPLETED: {
        // By confirmed end date (closer to now = higher priority)
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
 * Hook to filter and sort hosted events by status
 */
export function useFilteredHostedEvents(
  events: HostedEventApiItem[],
): FilteredHostedEvents {
  return useMemo(() => {
    const filtered: FilteredHostedEvents = {
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
      [EventStatus.VOTING]: sortHostedEvents(
        filtered[EventStatus.VOTING],
        EventStatus.VOTING,
      ),
      [EventStatus.VOTING_ENDED]: sortHostedEvents(
        filtered[EventStatus.VOTING_ENDED],
        EventStatus.VOTING_ENDED,
      ),
      [EventStatus.CONFIRMED]: sortHostedEvents(
        filtered[EventStatus.CONFIRMED],
        EventStatus.CONFIRMED,
      ),
      [EventStatus.COMPLETED]: sortHostedEvents(
        filtered[EventStatus.COMPLETED],
        EventStatus.COMPLETED,
      ),
    };
  }, [events]);
}
