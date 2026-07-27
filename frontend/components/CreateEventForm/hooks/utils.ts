// =============================================================================
// Date/Time Utilities (shared across hooks and components)
// =============================================================================

import {
  addCalendarDays,
  calendarDayToWallClock,
  todayInZone,
} from "@/lib/calendarDay";
import { instantToZonedWallClock } from "@/lib/time";
import { wallClockToDate } from "@/lib/wallClock";
import type { CalendarDay } from "@/lib/calendarDay";
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
 * Parse time string (HH:MM) to total minutes
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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
): { date: CalendarDay; time: string } | null {
  if (formData.eventType === "RECURRING") {
    return {
      date: addCalendarDays(
        todayInZone(formData.timeZone, now),
        RECURRING_DEADLINE_DAYS,
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
    wallClockToDate(
      calendarDayToWallClock(formData.startDate, formData.startTime),
    ) <= wallNow;

  return {
    date: formData.startDate,
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
