// =============================================================================
// Date/Time Utilities (shared across hooks and components)
// =============================================================================

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
 * Get a reasonable default start time (current time + 2 hours, rounded to 15 min)
 * Returns "00:00" if that would push into the next day
 */
export function getDefaultStartTime(): string {
  const now = new Date();
  const targetMinutes = now.getHours() * 60 + now.getMinutes() + 120; // +2 hours

  if (targetMinutes >= 24 * 60) {
    return "00:00";
  }

  const roundedMinutes = Math.ceil(targetMinutes / 15) * 15;
  const finalMinutes = Math.min(roundedMinutes, 23 * 60 + 45);

  return formatMinutesToTime(finalMinutes);
}

// =============================================================================
// Internal Utilities
// =============================================================================

/**
 * Format minutes to time string (HH:MM)
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
