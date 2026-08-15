import { EventType, EventWithCapabilities, EventSchedule } from "@/types/event";
import { formatWeekdayLabel } from "@/lib/event/event-time";
import { calendarDayParts, calendarDayToDate } from "@/lib/time";
import type { AxisSpan } from "@/lib/event/axisSpan";

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

export function formatAxisKeyLabel(span: AxisSpan, locale: string): string {
  if (span.axisType === "WEEKDAY") {
    return formatWeekdayLabel(span.weekday, locale);
  }

  // Month and day are the stored digits, so they are read off the string
  // rather than routed through a Date whose anchor could disagree with the
  // grid header's.
  const { month, day } = calendarDayParts(span.startDay);
  return `${month}/${day}`;
}
