import {
  EventStatus,
  EventSlotAxisType,
  EventWithCapabilities,
  ConfirmedTimeRange,
  EventSchedule,
} from "@/types/event";
import { formatMinutesToTime } from "@/lib/utils";
import { formatWeekdayLabel } from "@/lib/weekdays";

type EventWithDateRange = EventWithCapabilities & {
  startDate: string;
  endDate: string;
  votingDeadline?: string | null;
  confirmedTimeRanges?: ConfirmedTimeRange[];
  schedule?: EventSchedule;
};

export function getEventCandidateDateRange(event: EventWithDateRange) {
  if (event.schedule?.kind === "ONE_TIME") {
    return {
      start: new Date(event.schedule.startDate),
      end: new Date(event.schedule.endDate),
    };
  }

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

export function formatEventScheduleSummary(
  event: EventWithDateRange,
  locale: string,
): string {
  if (event.schedule?.kind === "RECURRING" && event.schedule.weekdays?.length) {
    const weekdayLabels = event.schedule.weekdays.map((weekday) =>
      formatWeekdayLabel(
        weekday,
        locale,
        locale.startsWith("zh") ? "narrow" : "short",
      ),
    );
    const startTime = formatMinutesToTime(event.schedule.startMinuteOfDay ?? 0);
    const endTime = formatMinutesToTime(event.schedule.endMinuteOfDay ?? 0);
    return `${weekdayLabels.join(", ")} • ${startTime} ~ ${endTime}`;
  }

  const { start, end } = getEventCandidateDateRange(event);
  const startLabel = `${start.getMonth() + 1}/${start.getDate()}`;
  const endLabel = `${end.getMonth() + 1}/${end.getDate()}`;
  return startLabel === endLabel ? startLabel : `${startLabel} ~ ${endLabel}`;
}

export function formatAxisKeyLabel(
  axisKey: string,
  axisType: EventSlotAxisType,
  locale: string,
): string {
  if (axisType === "WEEKDAY") {
    return formatWeekdayLabel(
      axisKey as Parameters<typeof formatWeekdayLabel>[0],
      locale,
    );
  }

  const date = new Date(axisKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
