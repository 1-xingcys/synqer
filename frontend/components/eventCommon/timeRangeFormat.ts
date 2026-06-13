"use client";

import { formatMinutesToTime } from "@/lib/utils";
import { formatWeekdayLabel, formatWeekdayLabelFromDate } from "@/lib/weekdays";
import { type EventSlotAxisType, type Weekday } from "@/types/event";

export type LocalizedTimeRangeFormatOptions = {
  timeZone?: string;
  weekdayStyle?: "narrow" | "short";
};

// Parse supported string/date inputs into a Date while preserving UTC-only dates.
function parseDateInput(
  dateInput: string | Date,
  options: LocalizedTimeRangeFormatOptions = {},
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

// Limit locale handling to the product's supported date formatting variants.
function getLocalizedDateLocale(locale: string) {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

// Format a minute-based range such as 1020-1140 into "17:00 - 19:00".
function formatMinuteTimeRange(startMinute: number, endMinute: number) {
  return `${formatMinutesToTime(startMinute)} - ${formatMinutesToTime(endMinute)}`;
}

// Format a concrete date into the product's canonical date + weekday label.
function formatLocalizedDateLabelFromDate(
  date: Date,
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  const dateLocale = getLocalizedDateLocale(locale);
  // Use one shared time zone for both the numeric date and weekday text so
  // labels like "6/13 (Sat)" cannot disagree internally.
  const dateText = new Intl.DateTimeFormat(dateLocale, {
    month: "numeric",
    day: "numeric",
    timeZone: options.timeZone,
  }).format(date);
  const weekdayText = formatWeekdayLabelFromDate(
    date,
    dateLocale,
    options.weekdayStyle ?? (locale === "zh-TW" ? "narrow" : "short"),
    options.timeZone,
  );

  return locale === "zh-TW"
    ? `${dateText}（${weekdayText}）`
    : `${dateText} (${weekdayText})`;
}

// Format a weekday-only label for recurring events.
function formatLocalizedWeekdayLabel(
  weekday: Weekday,
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  const weekdayText = formatWeekdayLabel(
    weekday,
    locale,
    options.weekdayStyle ?? (locale === "zh-TW" ? "narrow" : "short"),
  );

  return locale === "zh-TW" ? `（${weekdayText}）` : `(${weekdayText})`;
}

// Format the time portion of a concrete datetime.
function formatLocalizedTimeLabelFromDate(
  date: Date,
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(getLocalizedDateLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: options.timeZone,
  }).format(date);
}

// Parse and format a date string with the canonical date label formatter.
function formatLocalizedDateLabel(
  dateString: string,
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  const date = parseDateInput(dateString, options);
  return formatLocalizedDateLabelFromDate(date, locale, options);
}

// Format a date span, collapsing same-day ranges to a single label.
function formatLocalizedDateRange(
  startDate: string,
  endDate: string,
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  const startDateLabel = formatLocalizedDateLabel(startDate, locale, options);
  if (startDate === endDate) {
    return startDateLabel;
  }

  return `${startDateLabel} - ${formatLocalizedDateLabel(endDate, locale, options)}`;
}

// Format a date-based slot range such as "4/21 (Mon) 10:00 - 11:00".
function formatLocalizedDateMinuteRangeLabel(
  range: {
    startDate: string;
    endDate: string;
    startMinute: number;
    endMinute: number;
  },
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  return `${formatLocalizedDateRange(range.startDate, range.endDate, locale, options)} ${formatMinuteTimeRange(range.startMinute, range.endMinute)}`;
}

// Format a recurring weekday slot range such as "(Mon) 10:00 - 12:00".
function formatLocalizedWeekdayTimeRangeLabel(
  range: {
    weekday: Weekday;
    startMinute: number;
    endMinute: number;
  },
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  const weekdayLabel = formatLocalizedWeekdayLabel(
    range.weekday,
    locale,
    options,
  );

  return `${weekdayLabel} ${formatMinuteTimeRange(range.startMinute, range.endMinute)}`;
}

// Format a concrete datetime range, including both dates when it crosses days.
export function formatLocalizedDateTimeRangeLabel(
  range: {
    startTime: string;
    endTime: string;
  },
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  const startDate = new Date(range.startTime);
  const endDate = new Date(range.endTime);
  const startDateLabel = formatLocalizedDateLabelFromDate(
    startDate,
    locale,
    options,
  );
  const endDateLabel = formatLocalizedDateLabelFromDate(
    endDate,
    locale,
    options,
  );
  const timeLabel = `${formatLocalizedTimeLabelFromDate(startDate, locale, options)} - ${formatLocalizedTimeLabelFromDate(endDate, locale, options)}`;
  const isSameDay = startDateLabel === endDateLabel;

  if (isSameDay) {
    return `${startDateLabel} ${timeLabel}`;
  }

  return `${startDateLabel} - ${endDateLabel} ${timeLabel}`;
}

// Dispatch axis-based ranges to the matching shape-specific formatter.
export function formatLocalizedRangeLabel(
  range: {
    axisType: EventSlotAxisType;
    startDate: string;
    endDate: string;
    startMinute: number;
    endMinute: number;
  },
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  if (range.axisType === "WEEKDAY" && range.startDate === range.endDate) {
    return formatLocalizedWeekdayTimeRangeLabel(
      {
        weekday: range.startDate as Weekday,
        startMinute: range.startMinute,
        endMinute: range.endMinute,
      },
      locale,
      options,
    );
  }

  return formatLocalizedDateMinuteRangeLabel(
    {
      startDate: range.startDate,
      endDate: range.endDate,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
    },
    locale,
    options,
  );
}
