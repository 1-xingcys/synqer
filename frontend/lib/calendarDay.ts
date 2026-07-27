import { instantToZonedWallClock } from "@/lib/time";

/**
 * A naive calendar day in "YYYY-MM-DD" form: no time, no zone.
 *
 * This is the currency for everything a date picker produces and everything the
 * API accepts as a candidate day. Keeping it a string rather than a `Date` is
 * deliberate — a `Date` cannot represent "a day" without also committing to a
 * zone, which is exactly how calendar days used to drift onto the wrong date.
 * As a side benefit, ordering and equality are plain string comparisons.
 */
export type CalendarDay = string;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The calendar day currently in progress in `timeZone`. */
export function todayInZone(
  timeZone: string,
  now: Date = new Date(),
): CalendarDay {
  // instantToZonedWallClock carries the zone's wall-clock digits in UTC fields.
  return wallClockToCalendarDay(instantToZonedWallClock(now, timeZone));
}

/**
 * Combine a calendar day and an "HH:mm" string into a naive wall-clock Date,
 * encoding the digits into the UTC fields. The event's time zone resolves this
 * to a real instant via `zonedWallClockToInstant` when one is needed.
 */
export function calendarDayToWallClock(day: CalendarDay, time: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, date, hours, minutes, 0, 0));
}

/** Inverse of {@link calendarDayToWallClock}: read the naive digits back. */
export function wallClockToCalendarDay(wallClock: Date): CalendarDay {
  return `${wallClock.getUTCFullYear()}-${pad(wallClock.getUTCMonth() + 1)}-${pad(wallClock.getUTCDate())}`;
}

/**
 * Read a slot's `axisDate` as the calendar day it stands for, or null when the
 * slot has none.
 *
 * `axisDate` is a naive wall-clock value carrying its digits in the UTC fields,
 * and reaches us as either a string or a Date depending on the caller. Four
 * separate open-coded versions of this used to exist, one of which assumed a
 * string and threw on a Date.
 */
export function axisDateToCalendarDay(
  axisDate?: string | Date | null,
): CalendarDay | null {
  if (!axisDate) {
    return null;
  }

  return wallClockToCalendarDay(new Date(axisDate));
}

/** Shift a calendar day by whole days, rolling over months and years. */
export function addCalendarDays(day: CalendarDay, days: number): CalendarDay {
  const [year, month, date] = day.split("-").map(Number);
  return wallClockToCalendarDay(
    new Date(Date.UTC(year, month - 1, date + days)),
  );
}
