// =============================================================================
// Date/Time Utilities (shared across hooks and components)
// =============================================================================

import { combineVotingDeadline } from "@/lib/votingDeadline";
import { instantToZonedWallClock } from "@/lib/time";

/**
 * Combine date and time into a single Date object
 */
export function combineDateAndTime(date: Date, time: string): Date {
  return combineVotingDeadline(date, time);
}

/**
 * Parse time string (HH:MM) to total minutes
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Today's calendar day *in the given time zone*, as a local-midnight Date.
 *
 * The date pickers speak local-midnight Dates that act purely as Y/M/D
 * carriers (combineDateAndTime re-encodes those digits into UTC fields), so
 * this returns the same shape. Deriving the day from the event's time zone
 * rather than the browser's keeps the picker bounds and the form validation
 * on the same calendar even when the host picks a foreign time zone.
 */
export function getTodayInTimeZone(timeZone: string, now: Date = new Date()) {
  // instantToZonedWallClock carries the zone's wall-clock digits in UTC
  // fields, so read them back with getUTC*.
  const wallNow = instantToZonedWallClock(now, timeZone);

  return new Date(
    wallNow.getUTCFullYear(),
    wallNow.getUTCMonth(),
    wallNow.getUTCDate(),
  );
}
