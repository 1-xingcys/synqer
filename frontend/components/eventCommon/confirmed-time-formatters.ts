import { ConfirmedTimeRange } from "@/types/event";
import { TimeSlot } from "@/components/eventCommon/timeGrid/types";
import { formatWeekdayLabel } from "@/lib/weekdays";

export function formatDefaultConfirmedTimeRange(
  range: ConfirmedTimeRange,
  locale: string,
): string {
  const startDate = new Date(range.startTime);
  const endDate = new Date(range.endTime);

  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  const startDateStr = dateFormatter.format(startDate);
  const startTimeStr = timeFormatter.format(startDate);
  const endTimeStr = timeFormatter.format(endDate);

  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (isSameDay) {
    return `${startDateStr} ${startTimeStr} - ${endTimeStr}`;
  }

  const endDateStr = dateFormatter.format(endDate);
  return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
}

export function formatRecurringConfirmedTimeRange(
  range: ConfirmedTimeRange,
  locale: string,
  slotsById: Map<string, TimeSlot>,
): string | null {
  const slots = range.slotIds
    .map((slotId) => slotsById.get(slotId))
    .filter((slot): slot is TimeSlot => Boolean(slot));

  if (
    slots.length === 0 ||
    slots[0].axisType !== "WEEKDAY" ||
    !slots[0].axisWeekday
  ) {
    return null;
  }

  const sortedSlots = [...slots].sort((left, right) => {
    if (left.startMinute !== right.startMinute) {
      return left.startMinute - right.startMinute;
    }
    return left.endMinute - right.endMinute;
  });

  const weekday = sortedSlots[0].axisWeekday;
  if (!weekday) {
    return null;
  }

  const weekdayLabel = formatWeekdayLabel(weekday, locale);
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return `${weekdayLabel} ${timeFormatter.format(new Date(range.startTime))} - ${timeFormatter.format(new Date(range.endTime))}`;
}

export function formatConfirmedTimeRange(
  range: ConfirmedTimeRange,
  locale: string,
  slotsById: Map<string, TimeSlot>,
): string {
  return (
    formatRecurringConfirmedTimeRange(range, locale, slotsById) ??
    formatDefaultConfirmedTimeRange(range, locale)
  );
}
