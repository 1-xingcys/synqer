import {
  EventStatus,
  EventWithCapabilities,
  ConfirmedTimeRange,
} from "@/types/event";

type EventWithDateRange = EventWithCapabilities & {
  startDate: string;
  endDate: string;
  votingDeadline?: string | null;
  confirmedTimeRanges?: ConfirmedTimeRange[];
};

export function getEventCandidateDateRange(event: EventWithDateRange) {
  return {
    start: new Date(event.startDate),
    end: new Date(event.endDate),
  };
}

export function getEventConfirmedStartTime(event: EventWithDateRange): number {
  const startTime = event.confirmedTimeRanges?.[0]?.startTime;
  return startTime ? new Date(startTime).getTime() : Infinity;
}

export function getEventConfirmedEndTime(event: EventWithDateRange): number {
  const endTime =
    event.confirmedTimeRanges?.[event.confirmedTimeRanges.length - 1]?.endTime;
  return endTime ? new Date(endTime).getTime() : Infinity;
}

export function getEventSortTime(
  event: EventWithDateRange,
  category: EventStatus,
  now = Date.now(),
): number {
  switch (category) {
    case EventStatus.VOTING: {
      const deadline = event.votingDeadline
        ? new Date(event.votingDeadline).getTime()
        : Infinity;
      return Math.abs(deadline - now);
    }
    case EventStatus.VOTING_ENDED:
      return Math.abs(new Date(event.startDate).getTime() - now);
    case EventStatus.CONFIRMED:
      return Math.abs(getEventConfirmedStartTime(event) - now);
    case EventStatus.COMPLETED:
      return Math.abs(getEventConfirmedEndTime(event) - now);
    default:
      return Infinity;
  }
}
