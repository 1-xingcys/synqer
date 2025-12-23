import { useMemo } from "react";
import { EventStatus } from "@/types/event";
import { ExtendedHostedEvent, toHostedEventRowData } from "./useHostedEvents";
import { HostedEventRowData } from "@/components/eventCommon/EventsOverview";

type EventCategory = "voting" | "votingEnded" | "confirmed" | "completed";

interface FilteredHostedEvents {
  voting: HostedEventRowData[];
  votingEnded: HostedEventRowData[];
  confirmed: HostedEventRowData[];
  completed: HostedEventRowData[];
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
  category: EventCategory,
): HostedEventRowData[] {
  const now = new Date().getTime();

  return [...events].sort((a, b) => {
    switch (category) {
      case "voting": {
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

      case "votingEnded": {
        // By start date (closer to now = higher priority)
        const startA = new Date(a.startDate).getTime();
        const startB = new Date(b.startDate).getTime();
        return Math.abs(startA - now) - Math.abs(startB - now);
      }

      case "confirmed": {
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

      case "completed": {
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
      voting: [],
      votingEnded: [],
      confirmed: [],
      completed: [],
    };

    // Categorize events by status and convert to row data
    events.forEach((event) => {
      const rowData = toHostedEventRowData(event);
      switch (event.status) {
        case EventStatus.VOTING:
          filtered.voting.push(rowData);
          break;
        case EventStatus.VOTING_ENDED:
          filtered.votingEnded.push(rowData);
          break;
        case EventStatus.CONFIRMED:
          filtered.confirmed.push(rowData);
          break;
        case EventStatus.COMPLETED:
          filtered.completed.push(rowData);
          break;
      }
    });

    // Sort each category
    return {
      voting: sortHostedEvents(filtered.voting, "voting"),
      votingEnded: sortHostedEvents(filtered.votingEnded, "votingEnded"),
      confirmed: sortHostedEvents(filtered.confirmed, "confirmed"),
      completed: sortHostedEvents(filtered.completed, "completed"),
    };
  }, [events]);
}
