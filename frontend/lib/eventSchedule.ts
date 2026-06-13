import { OneTimeEventSchedule } from "@/types/event";

/**
 * Mirror the backend's event-start calculation for one-time events.
 *
 * The backend stores the "wall clock" event time via UTC setters:
 * startMinuteOfDay=540 means "09:00 on that calendar date", and the
 * resulting ISO string becomes "...T09:00:00.000Z".
 *
 * Reusing the same UTC math on the frontend keeps UI locking rules aligned
 * with the API's deadline validation rules.
 */
export function getOneTimeEventStartInstant(
  schedule: OneTimeEventSchedule,
): Date {
  const eventStart = new Date(schedule.startDate);
  eventStart.setUTCHours(0, 0, 0, 0);
  eventStart.setUTCMinutes(schedule.startMinuteOfDay);
  return eventStart;
}
