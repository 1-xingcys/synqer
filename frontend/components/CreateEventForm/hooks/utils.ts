// =============================================================================
// Date/Time Utilities (shared across hooks and components)
// =============================================================================

import { formatMinutesToTime } from "@/lib/utils";

/**
 * Combine date and time into a single Date object
 */
export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Parse time string (HH:MM) to total minutes
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Get today's date at midnight (local time)
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get default start date and time (current time + 2 hours, rounded to 15 min)
 * Handles cross-day scenario correctly.
 *
 * Edge case handling:
 * - If current time is near midnight (e.g., 23:30), adding 2 hours results in
 *   targetMinutes > 24*60 (1440). In this case, we calculate the overflow and
 *   return tomorrow's date with the appropriate time.
 * - Example: At 23:30, targetMinutes = 23*60 + 30 + 120 = 1530 (25.5 hours)
 *   -> overflow = 1530 - 1440 = 90 minutes -> rounded = 90 -> time = "01:30"
 *   -> date = tomorrow
 */
export function getDefaultStartDateTime(): { date: Date; time: string } {
  const now = new Date();
  const targetMinutes = now.getHours() * 60 + now.getMinutes() + 120; // +2 hours

  const today = getToday();

  if (targetMinutes >= 24 * 60) {
    // Cross-day: use tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const overflowMinutes = targetMinutes - 24 * 60;
    const roundedMinutes = Math.ceil(overflowMinutes / 15) * 15;

    return {
      date: tomorrow,
      time: formatMinutesToTime(roundedMinutes),
    };
  }

  const roundedMinutes = Math.ceil(targetMinutes / 15) * 15;
  const finalMinutes = Math.min(roundedMinutes, 23 * 60 + 45);

  return {
    date: today,
    time: formatMinutesToTime(finalMinutes),
  };
}
