import {
  ConfirmedSelection,
  EventStatus,
  EventSlotAxisType,
  EventType,
  EventWithCapabilities,
  ConfirmedTimeRange,
  EventSchedule,
  Weekday,
} from "@/types/event";
import { formatMinutesToTime } from "@/lib/utils";
import { formatWeekdayLabel } from "@/lib/weekdays";

type EventWithDateRange = EventWithCapabilities & {
  startDate: string;
  endDate: string;
  type?: EventType;
  weekdays?: Weekday[];
  votingDeadline?: string | null;
  confirmedSelections?: ConfirmedSelection[];
  confirmedTimeRanges?: ConfirmedTimeRange[];
  schedule?: EventSchedule;
};

export function formatEventCandidateDaySummary(
  event: Pick<
    EventWithDateRange,
    "startDate" | "endDate" | "type" | "weekdays" | "schedule"
  >,
  locale: string,
): string {
  const recurringWeekdays =
    event.type === "RECURRING"
      ? (event.weekdays ??
        (event.schedule?.kind === "RECURRING"
          ? event.schedule.weekdays
          : undefined))
      : undefined;

  if (recurringWeekdays?.length) {
    return recurringWeekdays
      .map((weekday) =>
        formatWeekdayLabel(
          weekday,
          locale,
          locale.startsWith("zh") ? "narrow" : "short",
        ),
      )
      .join(", ");
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  return [
    `${start.getFullYear()}/${(start.getMonth() + 1).toString().padStart(2, "0")}/${start
      .getDate()
      .toString()
      .padStart(2, "0")}`,
    `${end.getFullYear()}/${(end.getMonth() + 1).toString().padStart(2, "0")}/${end
      .getDate()
      .toString()
      .padStart(2, "0")}`,
  ].join(" ~ ");
}

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
  const confirmedSelectionStart =
    event.confirmedSelections?.find(
      (selection) => selection.kind === "ONE_TIME_RANGE" && selection.startTime,
    )?.startTime ?? null;

  if (confirmedSelectionStart) {
    return new Date(confirmedSelectionStart).getTime();
  }

  const startTime = event.confirmedTimeRanges?.[0]?.startTime;
  return startTime ? new Date(startTime).getTime() : Infinity;
}

export function getEventConfirmedEndTime(event: EventWithDateRange): number {
  const confirmedSelectionEnd = [...(event.confirmedSelections ?? [])]
    .reverse()
    .find(
      (selection) => selection.kind === "ONE_TIME_RANGE" && selection.endTime,
    )?.endTime;

  if (confirmedSelectionEnd) {
    return new Date(confirmedSelectionEnd).getTime();
  }

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
