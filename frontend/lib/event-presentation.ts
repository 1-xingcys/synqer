import {
  EventSlotAxisType,
  EventType,
  EventWithCapabilities,
  EventSchedule,
} from "@/types/event";
import { formatWeekdayLabel } from "@/lib/weekdays";
import { formatDateInZone } from "@/lib/time";

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
