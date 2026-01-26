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
 * Get default start date and time (current time + 2 hours, rounded to 15 min)
 * Handles cross-day scenario correctly
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
