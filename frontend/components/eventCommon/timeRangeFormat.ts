"use client";

import { formatAxisKeyLabel } from "@/lib/event-presentation";
import { formatMinutesToTime } from "@/lib/utils";
import { type EventSlotAxisType } from "@/types/event";

function getDateLocale(locale: string) {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

type SharedDateFormatOptions = {
  timeZone?: string;
  weekdayStyle?: "narrow" | "short";
};

function parseDateInput(
  dateInput: string | Date,
  options: SharedDateFormatOptions = {},
) {
  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (dateInput.includes("T")) {
    return new Date(dateInput);
  }

  return options.timeZone === "UTC"
    ? new Date(`${dateInput}T00:00:00Z`)
    : new Date(`${dateInput}T00:00:00`);
}

function formatLocalizedDateFromDate(
  date: Date,
  locale: string,
  options: SharedDateFormatOptions = {},
) {
  const dateLocale = getDateLocale(locale);
  const dateText = new Intl.DateTimeFormat(dateLocale, {
    month: "numeric",
    day: "numeric",
    timeZone: options.timeZone,
  }).format(date);
  const weekdayText = new Intl.DateTimeFormat(dateLocale, {
    weekday: options.weekdayStyle ?? (locale === "zh-TW" ? "narrow" : "short"),
    timeZone: options.timeZone,
  }).format(date);

  return locale === "zh-TW"
    ? `${dateText}（${weekdayText}）`
    : `${dateText} (${weekdayText})`;
}

function formatLocalizedDate(
  dateString: string,
  locale: string,
  options: SharedDateFormatOptions = {},
) {
  const date = parseDateInput(dateString, options);

  return formatLocalizedDateFromDate(date, locale, options);
}

export function formatLocalizedDateRange(
  startDate: string,
  endDate: string,
  locale: string,
  options: SharedDateFormatOptions = {},
) {
  const startDateLabel = formatLocalizedDate(startDate, locale, options);
  if (startDate === endDate) {
    return startDateLabel;
  }

  return `${startDateLabel} - ${formatLocalizedDate(endDate, locale, options)}`;
}

function formatMinuteTimeRange(startMinute: number, endMinute: number) {
  return `${formatMinutesToTime(startMinute)} - ${formatMinutesToTime(endMinute)}`;
}

export function formatLocalizedDateMinuteRangeLabel(
  range: {
    startDate: string;
    endDate: string;
    startMinute: number;
    endMinute: number;
  },
  locale: string,
  options: SharedDateFormatOptions = {},
) {
  return `${formatLocalizedDateRange(range.startDate, range.endDate, locale, options)}  ${formatMinuteTimeRange(range.startMinute, range.endMinute)}`;
}

export function formatLocalizedAxisMinuteRangeLabel(
  range: {
    axisType: EventSlotAxisType;
    startDate: string;
    endDate: string;
    startMinute: number;
    endMinute: number;
  },
  locale: string,
) {
  const startLabel = formatAxisKeyLabel(
    range.startDate,
    range.axisType,
    locale,
  );
  const endLabel = formatAxisKeyLabel(range.endDate, range.axisType, locale);
  const axisLabel =
    startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;

  return `${axisLabel}  ${formatMinuteTimeRange(range.startMinute, range.endMinute)}`;
}

export function formatLocalizedConfirmedDateTimeRangeLabel(
  range: {
    startTime: string;
    endTime: string;
  },
  locale: string,
  options: SharedDateFormatOptions = {},
) {
  const startDate = new Date(range.startTime);
  const endDate = new Date(range.endTime);
  const timeZone = options.timeZone;
  const startDateLabel = formatLocalizedDateFromDate(startDate, locale, {
    ...options,
    timeZone,
  });
  const endDateLabel = formatLocalizedDateFromDate(endDate, locale, {
    ...options,
    timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat(getDateLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  const timeLabel = `${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
  const isSameDay = startDateLabel === endDateLabel;

  if (isSameDay) {
    return `${startDateLabel}  ${timeLabel}`;
  }

  return `${startDateLabel} - ${endDateLabel}  ${timeLabel}`;
}
