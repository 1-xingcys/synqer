import { ConfirmedSelection, ConfirmedTimeRange } from "@/types/event";
import { formatWeekdayLabel } from "@/lib/weekdays";
import { formatMinutesToTime } from "@/lib/utils";

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

export function formatConfirmedSelection(
  selection: ConfirmedSelection,
  locale: string,
): string | null {
  if (selection.kind === "ONE_TIME_RANGE") {
    if (!selection.startTime || !selection.endTime) {
      return null;
    }

    return formatDefaultConfirmedTimeRange(
      {
        startTime: selection.startTime,
        endTime: selection.endTime,
        slotIds: selection.slotIds,
      },
      locale,
    );
  }

  if (
    selection.kind !== "WEEKDAY_RANGE" ||
    !selection.weekday ||
    typeof selection.startMinute !== "number" ||
    typeof selection.endMinute !== "number"
  ) {
    return null;
  }

  const weekdayLabel = formatWeekdayLabel(selection.weekday, locale);
  return `${weekdayLabel} ${formatMinutesToTime(selection.startMinute)} - ${formatMinutesToTime(selection.endMinute)}`;
}

export function formatConfirmedTimeRange(
  range: ConfirmedTimeRange,
  locale: string,
): string {
  return formatDefaultConfirmedTimeRange(range, locale);
}
