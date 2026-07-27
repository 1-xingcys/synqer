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
export type WallClock = string;

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
