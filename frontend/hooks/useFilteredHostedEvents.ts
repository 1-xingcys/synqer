import { useMemo } from "react";
import { EventStatus } from "@/types/event";
import { ExtendedHostedEvent, toHostedEventRowData } from "./useHostedEvents";
import { HostedEventRowData } from "@/components/eventCommon/EventsOverview";

interface FilteredHostedEvents {
  [EventStatus.VOTING]: HostedEventRowData[];
  [EventStatus.VOTING_ENDED]: HostedEventRowData[];
  [EventStatus.CONFIRMED]: HostedEventRowData[];
  [EventStatus.COMPLETED]: HostedEventRowData[];
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
  events: HostedEventRowData[],
  category: EventStatus,
): HostedEventRowData[] {
  const now = new Date().getTime();

  return [...events].sort((a, b) => {
    switch (category) {
      case EventStatus.VOTING: {
        // Events where not everyone has voted come first
        const aAllVoted =
          (a.votedCount ?? 0) >=
          (a.expectedParticipantCount ?? a.participantCount);
        const bAllVoted =
          (b.votedCount ?? 0) >=
          (b.expectedParticipantCount ?? b.participantCount);
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
        // Use the first confirmedTimeRange's startTime
        const confirmedStartA =
          a.confirmedTimeRanges && a.confirmedTimeRanges.length > 0
            ? new Date(a.confirmedTimeRanges[0].startTime).getTime()
            : Infinity;
        const confirmedStartB =
          b.confirmedTimeRanges && b.confirmedTimeRanges.length > 0
            ? new Date(b.confirmedTimeRanges[0].startTime).getTime()
            : Infinity;
        return (
          Math.abs(confirmedStartA - now) - Math.abs(confirmedStartB - now)
        );
      }

      case EventStatus.COMPLETED: {
        // By confirmed end date (closer to now = higher priority)
        // Use the last confirmedTimeRange's endTime
        const confirmedEndA =
          a.confirmedTimeRanges && a.confirmedTimeRanges.length > 0
            ? new Date(
                a.confirmedTimeRanges[a.confirmedTimeRanges.length - 1].endTime,
              ).getTime()
            : Infinity;
        const confirmedEndB =
          b.confirmedTimeRanges && b.confirmedTimeRanges.length > 0
            ? new Date(
                b.confirmedTimeRanges[b.confirmedTimeRanges.length - 1].endTime,
              ).getTime()
            : Infinity;
        return Math.abs(confirmedEndA - now) - Math.abs(confirmedEndB - now);
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
  events: ExtendedHostedEvent[],
): FilteredHostedEvents {
  return useMemo(() => {
    const filtered: FilteredHostedEvents = {
      [EventStatus.VOTING]: [],
      [EventStatus.VOTING_ENDED]: [],
      [EventStatus.CONFIRMED]: [],
      [EventStatus.COMPLETED]: [],
    };

    // Categorize events by status and convert to row data
    events.forEach((event) => {
      const rowData = toHostedEventRowData(event);
      switch (event.status) {
        case EventStatus.VOTING:
          filtered[EventStatus.VOTING].push(rowData);
          break;
        case EventStatus.VOTING_ENDED:
          filtered[EventStatus.VOTING_ENDED].push(rowData);
          break;
        case EventStatus.CONFIRMED:
          filtered[EventStatus.CONFIRMED].push(rowData);
          break;
        case EventStatus.COMPLETED:
          filtered[EventStatus.COMPLETED].push(rowData);
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
