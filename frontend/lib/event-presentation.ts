import {
  EventSlotAxisType,
  EventType,
  EventWithCapabilities,
  EventSchedule,
} from "@/types/event";
import { formatWeekdayLabel } from "@/lib/weekdays";
import { formatDateInZone, parseCalendarDayValue } from "@/lib/time";

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

  // Candidate dates are naive calendar days stored at UTC midnight, so they are
  // read back in UTC — local getters would shift them for viewers west of UTC.
  return [
    formatDateInZone(new Date(event.schedule.startDate), "UTC"),
    formatDateInZone(new Date(event.schedule.endDate), "UTC"),
  ].join(" ~ ");
}

/**
 * Compact candidate-day label for event list rows: "Jul 30 - Aug 2, 2026", or
 * the weekday list for recurring events.
 *
 * Candidate dates are naive calendar days stored at UTC midnight, so they are
 * rendered in UTC — `date-fns` formatting reads local fields and would show the
 * previous day for viewers west of UTC.
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

  const startDate = new Date(schedule.startDate);
  const endDate = new Date(schedule.endDate);
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
