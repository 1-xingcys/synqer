// Intra-module import stays relative: see lib/time/calendarDay.ts.
import { formatWeekdayLabel, formatWeekdayLabelFromDate } from "./weekdays";
import { type Weekday } from "@/types/event";
import type { AxisSpan } from "@/lib/axisSpan";
import {
  calendarDayToDate,
  formatMinutesToTime,
  wallClockDay,
  wallClockToDate,
  type CalendarDay,
  type WallClock,
} from "@/lib/time";

/**
 * Every value labelled here is naive: a calendar day has no zone of its own,
 * and a `WallClock` carries its digits in a Date's UTC fields. Projecting
 * either into a real zone shifts it off the stored value, so all formatting is
 * pinned to UTC and no function here takes a time zone.
 */
const NAIVE_TIME_ZONE = "UTC";

// Limit locale handling to the product's supported date formatting variants.
function dateLocaleOf(locale: string) {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}

function weekdayStyleOf(locale: string): "narrow" | "short" {
  return locale === "zh-TW" ? "narrow" : "short";
}

// "(Mon)" / "（一）".
function bracketWeekday(weekdayText: string, locale: string) {
  return locale === "zh-TW" ? `（${weekdayText}）` : `(${weekdayText})`;
}

// zh-TW butts the bracketed weekday against the date; en-US spaces it out.
function withWeekday(dateText: string, weekdayText: string, locale: string) {
  const bracketed = bracketWeekday(weekdayText, locale);

  return locale === "zh-TW"
    ? `${dateText}${bracketed}`
    : `${dateText} ${bracketed}`;
}

// A concrete date as the product's canonical date + weekday label, "6/13 (Sat)".
function formatDayLabel(date: Date, locale: string) {
  const dateLocale = dateLocaleOf(locale);
  // One shared time zone for both the numeric date and the weekday text, so
  // labels like "6/13 (Sat)" cannot disagree internally.
  const dateText = new Intl.DateTimeFormat(dateLocale, {
    month: "numeric",
    day: "numeric",
    timeZone: NAIVE_TIME_ZONE,
  }).format(date);
  const weekdayText = formatWeekdayLabelFromDate(
    date,
    dateLocale,
    weekdayStyleOf(locale),
    NAIVE_TIME_ZONE,
  );

  return withWeekday(dateText, weekdayText, locale);
}

// The time-of-day part of a concrete datetime, "18:00".
function formatClockLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(dateLocaleOf(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: NAIVE_TIME_ZONE,
  }).format(date);
}

// A minute-based range such as 1020-1140 as "17:00 - 19:00".
function formatMinuteRange(startMinute: number, endMinute: number) {
  return `${formatMinutesToTime(startMinute)} - ${formatMinutesToTime(endMinute)}`;
}

// A date span, collapsing a same-day range to a single label.
function formatDaySpanLabel(
  startDay: CalendarDay,
  endDay: CalendarDay,
  locale: string,
) {
  const startLabel = formatDayLabel(calendarDayToDate(startDay), locale);

  if (startDay === endDay) {
    return startLabel;
  }

  return `${startLabel} - ${formatDayLabel(calendarDayToDate(endDay), locale)}`;
}

// A recurring weekday as its bracketed label, "(Mon)".
function formatWeekdaySpanLabel(weekday: Weekday, locale: string) {
  const dateLocale = dateLocaleOf(locale);

  return bracketWeekday(
    formatWeekdayLabel(weekday, dateLocale, weekdayStyleOf(locale)),
    locale,
  );
}

/**
 * A concrete datetime range: "7/30 (Thu) 18:00 - 20:00", widening to both days
 * when it crosses midnight.
 */
export function formatLocalizedDateTimeRangeLabel(
  range: {
    startTime: WallClock;
    endTime: WallClock;
  },
  locale: string,
) {
  const startDate = wallClockToDate(range.startTime);
  const endDate = wallClockToDate(range.endTime);
  // Compare the days themselves rather than their rendered labels: whether the
  // range crosses midnight is a fact about the times, not about how they print.
  const isSameDay =
    wallClockDay(range.startTime) === wallClockDay(range.endTime);
  const dayLabel = isSameDay
    ? formatDayLabel(startDate, locale)
    : `${formatDayLabel(startDate, locale)} - ${formatDayLabel(endDate, locale)}`;

  return `${dayLabel} ${formatClockLabel(startDate, locale)} - ${formatClockLabel(endDate, locale)}`;
}

/**
 * A slot range on its axis: "6/13（六） - 6/14（日） 20:30 - 23:30" for a date
 * span, "(Mon) 10:00 - 12:00" for a recurring weekday.
 *
 * The union narrows on `axisType`, so a weekday payload cannot reach the date
 * formatter.
 */
export function formatLocalizedRangeLabel(
  range: AxisSpan & { startMinute: number; endMinute: number },
  locale: string,
) {
  const axisLabel =
    range.axisType === "WEEKDAY"
      ? formatWeekdaySpanLabel(range.weekday, locale)
      : formatDaySpanLabel(range.startDay, range.endDay, locale);

  return `${axisLabel} ${formatMinuteRange(range.startMinute, range.endMinute)}`;
}
