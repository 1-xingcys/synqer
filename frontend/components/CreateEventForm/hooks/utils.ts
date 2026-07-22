// =============================================================================
// Date/Time Utilities (shared across hooks and components)
// =============================================================================

import { combineVotingDeadline } from "@/lib/votingDeadline";
import { instantToZonedWallClock } from "@/lib/time";
import type { CreateEventFormData } from "../types";

/** How long a recurring event collects availability by default. */
const RECURRING_DEADLINE_DAYS = 7;

/**
 * The deadline TimePicker runs in "start" mode, whose options stop at 23:45
 * and whose validator rejects hour 24. An event may still end at "24:00", so
 * fold that onto the last selectable slot rather than proposing a value the
 * picker cannot represent.
 */
const LATEST_DEADLINE_TIME = "23:45";

function toDeadlineTime(time: string): string {
  return time === "24:00" ? LATEST_DEADLINE_TIME : time;
}

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

type VotingDeadlineDefaultInput = Pick<
  CreateEventFormData,
  "eventType" | "startDate" | "startTime" | "endTime" | "timeZone"
>;

/**
 * The voting deadline we propose before the host touches the field.
 *
 * One-time events have a natural end point — the event start — so the
 * deadline tracks it. Recurring events have none, so they get a fixed
 * "one week to collect availability" window instead.
 *
 * Returns null when there is nothing sensible to propose.
 */
export function getDefaultVotingDeadline(
  formData: VotingDeadlineDefaultInput,
  now: Date = new Date(),
): { date: Date; time: string } | null {
  if (formData.eventType === "RECURRING") {
    const today = getTodayInTimeZone(formData.timeZone, now);

    return {
      date: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + RECURRING_DEADLINE_DAYS,
      ),
      time: toDeadlineTime(formData.endTime),
    };
  }

  if (!formData.startDate) {
    return null;
  }

  // Voting may now start on a slot that has already passed today. Defaulting
  // the deadline to that start would close voting the moment the event is
  // created, so fall back to the end of the same day's window.
  const wallNow = instantToZonedWallClock(now, formData.timeZone);
  const hasStartPassed =
    combineDateAndTime(formData.startDate, formData.startTime) <= wallNow;

  return {
    date: new Date(formData.startDate),
    time: toDeadlineTime(
      hasStartPassed ? formData.endTime : formData.startTime,
    ),
  };
}

/**
 * Re-apply the proposed deadline unless the host has edited it themselves.
 * Pipe form updates that feed getDefaultVotingDeadline through this so the
 * proposal keeps tracking the schedule until it is deliberately overridden.
 */
export function withSyncedVotingDeadline(
  formData: CreateEventFormData,
  now: Date = new Date(),
): CreateEventFormData {
  if (formData.votingDeadlineTouched) {
    return formData;
  }

  const proposed = getDefaultVotingDeadline(formData, now);

  return {
    ...formData,
    votingDeadline: proposed?.date ?? null,
    votingDeadlineTime: proposed?.time ?? null,
  };
}
