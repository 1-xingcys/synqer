import {
  EventSlotAxisType,
  EventType,
  EventWithCapabilities,
  EventSchedule,
  Weekday,
} from "@/types/event";
import { formatMinutesToTime } from "@/lib/utils";
import { formatWeekdayLabel } from "@/lib/weekdays";

type EventWithDateRange = EventWithCapabilities & {
  type?: EventType;
  weekdays?: Weekday[];
  schedule?: EventSchedule;
};

export function formatEventCandidateDaySummary(
  event: Pick<EventWithDateRange, "type" | "weekdays" | "schedule">,
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

  if (event.schedule?.kind !== "ONE_TIME") {
    return "";
  }

  const start = new Date(event.schedule.startDate);
  const end = new Date(event.schedule.endDate);
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

  if (event.schedule?.kind !== "ONE_TIME") {
    return "";
  }

  const start = new Date(event.schedule.startDate);
  const end = new Date(event.schedule.endDate);
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
