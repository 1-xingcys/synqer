import {
  EventSlotAxisType,
  EventType,
  EventWithCapabilities,
  EventSchedule,
} from "@/types/event";
import { formatWeekdayLabel } from "@/lib/weekdays";
import { calendarDayToDate, parseCalendarDayValue } from "@/lib/calendarDay";

type EventWithDateRange = EventWithCapabilities & {
  type?: EventType;
  schedule?: EventSchedule;
};

export function formatEventCandidateDaySummary(
  event: Pick<EventWithDateRange, "type" | "schedule">,
  locale: string,
): string {
  const recurringWeekdays =
    event.type === "RECURRING"
      ? event.schedule?.kind === "RECURRING"
        ? event.schedule.weekdays
        : undefined
      : undefined;

  if (recurringWeekdays?.length) {
    return recurringWeekdays
      .map((weekday) => formatWeekdayLabel(weekday, locale))
      .join(", ");
  }

  if (event.schedule?.kind !== "ONE_TIME") {
    return "";
  }

  return [event.schedule.startDate, event.schedule.endDate]
    .map((day) => day.split("-").join("/"))
    .join(" ~ ");
}

/**
 * Compact candidate-day label for event list rows: "Jul 30 - Aug 2, 2026", or
 * the weekday list for recurring events.
 */
export function formatEventDateRangeLabel(
  schedule: EventSchedule | undefined,
  locale: string,
): string {
  if (schedule?.kind === "RECURRING" && schedule.weekdays?.length) {
    return schedule.weekdays
      .map((weekday) => formatWeekdayLabel(weekday, locale))
      .join(", ");
  }

  if (schedule?.kind !== "ONE_TIME") {
    return "";
  }

  // Calendar days carry no zone, so they are rendered through UTC rather than
  // the viewer's local fields.
  const startDate = calendarDayToDate(schedule.startDate);
  const endDate = calendarDayToDate(schedule.endDate);
  const format = (date: Date, withYear: boolean) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" as const } : {}),
      timeZone: "UTC",
    }).format(date);

  const isSameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  return `${format(startDate, !isSameYear)} - ${format(endDate, true)}`;
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

  // Shares the grid header's parser so the modal label can never disagree with
  // the column the user selected.
  const date = parseCalendarDayValue(axisKey);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
