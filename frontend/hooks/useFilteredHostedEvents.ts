import { useMemo } from "react";
import { EventStatus } from "@/types/event";
import { HostedEventApiItem } from "./useHostedEvents";

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
 * Voting Ended / Confirmed / Completed: By creation time (newer first)
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
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      case EventStatus.CONFIRMED: {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      case EventStatus.COMPLETED: {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
