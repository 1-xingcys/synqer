import { instantToZonedWallClock } from "@/lib/time";
import type { WallClock } from "@/lib/wallClock";

/**
 * A naive calendar day in "YYYY-MM-DD" form: no time, no zone.
 *
 * This is the currency for everything a date picker produces and everything the
 * API accepts as a candidate day. Keeping it a string rather than a `Date` is
 * deliberate — a `Date` cannot represent "a day" without also committing to a
 * zone, which is exactly how calendar days used to drift onto the wrong date.
 * As a side benefit, ordering and equality are plain string comparisons.
 */
export type CalendarDay = string & { readonly __brand: "CalendarDay" };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

const CALENDAR_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The only way to turn an arbitrary string into a {@link CalendarDay}.
 *
 * Throws rather than coercing: the failure modes this guards against are all
 * silent. A wall clock passed here used to flow on to `addCalendarDays` and
 * come back "NaN-NaN-NaN"; an unpadded value breaks the lexicographic
 * ordering the whole encoding exists for.
 */
export function calendarDay(value: string): CalendarDay {
  const match = CALENDAR_DAY_PATTERN.exec(value);

  if (!match) {
    throw new TypeError(
      `"${value}" is not a calendar day (expected YYYY-MM-DD)`,
    );
  }

  const [year, month, date] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));

  // Date.UTC rolls impossible values over ("2026-02-30" becomes March 2), so
  // the digits have to survive the round trip to count as a real day.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== date
  ) {
    throw new TypeError(`"${value}" is not a calendar day (no such date)`);
  }

  return value as CalendarDay;
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
 * The day as a Date whose UTC fields hold its digits at midnight, for `Intl`
 * formatters pinned to `timeZone: "UTC"`.
 */
export function calendarDayToDate(day: CalendarDay): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

/**
 * Combine a calendar day and an "HH:mm" string into a {@link WallClock} — the
 * shape the API expects for `votingDeadline`, so the result needs no further
 * serialisation.
 */
export function calendarDayToWallClock(
  day: CalendarDay,
  time: string,
): WallClock {
  const [year, month, date] = day.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  // `toISOString` already throws on a malformed `time` (Date.UTC yields NaN),
  // and its output is the wire form by construction, so this is a construction
  // point rather than a parse. Calling `wallClock()` here would also make the
  // calendarDay/wallClock import cycle a runtime one.
  return new Date(
    Date.UTC(year, month - 1, date, hours, minutes, 0, 0),
  ).toISOString() as WallClock;
}

/** Inverse of {@link calendarDayToWallClock}: read the naive digits back. */
export function wallClockToCalendarDay(wallClock: Date): CalendarDay {
  // An invalid Date yields NaN from every getter, and the template below would
  // brand the string "NaN-NaN-NaN" as a real day. This is the only failure mode
  // here: any valid Date produces a well-formed value by construction.
  if (Number.isNaN(wallClock.getTime())) {
    throw new TypeError("Cannot read a calendar day from an invalid Date");
  }

  return `${wallClock.getUTCFullYear()}-${pad(wallClock.getUTCMonth() + 1)}-${pad(wallClock.getUTCDate())}` as CalendarDay;
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
