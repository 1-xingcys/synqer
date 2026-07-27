import { wallClockToCalendarDay, type CalendarDay } from "@/lib/calendarDay";
import { zonedWallClockToInstant } from "@/lib/time";

/**
 * A naive wall-clock timestamp: a day plus a time, with no zone of its own.
 *
 * The wire carries it as an ISO string whose UTC fields hold the digits —
 * "2026-07-30T18:00:00.000Z" means 18:00 in the event's time zone, not 18:00
 * UTC. That shape is deliberately preserved rather than rewritten to a
 * zone-less form: `new Date("2026-07-30T18:00")` would parse as *local* time
 * and silently produce the wrong instant, whereas this form at least lands the
 * right digits in the UTC fields.
 *
 * What it does not survive is being read with local getters or projected into
 * another zone. Read it through the helpers here rather than `new Date()`.
 *
 * `votingDeadline` and `ConfirmedSelection.startTime`/`endTime` are the two
 * fields carrying this shape.
 */
export type WallClock = string & { readonly __brand: "WallClock" };

const WALL_CLOCK_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?Z$/;

/**
 * The only way to turn an arbitrary string into a {@link WallClock}.
 *
 * Throws rather than coercing. The misuse this guards against is the quietest
 * one in the codebase: a calendar day read as a wall clock reports "00:00",
 * a plausible-looking time rather than an obvious failure.
 *
 * The trailing "Z" is required. A value carrying a real offset is an instant,
 * and reading its digits as naive shifts it by that offset.
 */
export function wallClock(value: string): WallClock {
  const match = WALL_CLOCK_PATTERN.exec(value);

  if (!match) {
    throw new TypeError(
      `"${value}" is not a wall clock (expected YYYY-MM-DDTHH:mm[:ss[.SSS]]Z)`,
    );
  }

  const [year, month, date, hours, minutes, seconds, ms] = match
    .slice(1)
    .map((part) => (part === undefined ? 0 : Number(part)));
  const parsed = new Date(
    Date.UTC(year, month - 1, date, hours, minutes, seconds, ms),
  );

  // `Date.parse` is no help here: it rolls impossible values over rather than
  // rejecting them, so "2026-02-30T18:00:00.000Z" would quietly land two days
  // later. Only a full round trip of the digits catches that.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== date ||
    parsed.getUTCHours() !== hours ||
    parsed.getUTCMinutes() !== minutes ||
    parsed.getUTCSeconds() !== seconds ||
    parsed.getUTCMilliseconds() !== ms
  ) {
    throw new TypeError(`"${value}" is not a wall clock (no such time)`);
  }

  return value as WallClock;
}

/**
 * The value as a Date whose UTC fields hold the digits, for `Intl` formatters
 * pinned to `timeZone: "UTC"`.
 */
export function wallClockToDate(value: WallClock): Date {
  return new Date(value);
}

/** The calendar day part. */
export function wallClockDay(value: WallClock): CalendarDay {
  return wallClockToCalendarDay(wallClockToDate(value));
}

/** The time-of-day part as "HH:mm". */
export function wallClockTime(value: WallClock): string {
  const date = wallClockToDate(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/**
 * Resolve a slot's calendar day plus its minute-of-day offset to a real
 * instant in `timeZone`. A minute-of-day of 1440 ("24:00") rolls onto the next
 * day, which is how slot end boundaries are expressed.
 */
export function calendarDayMinuteToInstant(
  day: CalendarDay,
  minuteOfDay: number,
  timeZone: string,
): Date {
  const [year, month, date] = day.split("-").map(Number);
  return zonedWallClockToInstant(
    new Date(Date.UTC(year, month - 1, date, 0, minuteOfDay)),
    timeZone,
  );
}

/** Resolve the digits against a real time zone to get the actual instant. */
export function wallClockToInstant(value: WallClock, timeZone: string): Date {
  return zonedWallClockToInstant(wallClockToDate(value), timeZone);
}
