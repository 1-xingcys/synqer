// Character limits
export const TITLE_MAX_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 500;

// Fixed slot duration (in minutes)
export const SLOT_DURATION_MIN = 15;

// Feature flags
export const RESTRICT_START_DATE_TO_TODAY = false; // Set to true to restrict start date to today or later

// Minimum hours before event start time (to ensure enough voting time)
export const MIN_HOURS_BEFORE_EVENT = 1;

export interface CreateEventFormData {
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  timeZone: string;
  // New: Voting deadline
  votingDeadline: Date | null;
  votingDeadlineTime: string;
  votingDeadlineManuallySet: boolean;
  // LINE group integration
  lineGroupId: string | null;
  selectedLineUserIds: string[];
}

// Helper: Count characters (Chinese counts as 1, English counts as 1)
export function countCharacters(str: string): number {
  // Simply count each character as 1 (works for both Chinese and English)
  return [...str].length;
}

// Helper: Truncate string to max characters
export function truncateToMaxChars(str: string, maxChars: number): string {
  const chars = [...str];
  if (chars.length <= maxChars) {
    return str;
  }
  return chars.slice(0, maxChars).join("");
}

// Generate time options for dropdowns (15-minute intervals)
export function generateTimeOptions(
  includeStartOfDay: boolean = true,
  includeEndOfDay: boolean = false,
): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push(time);
    }
  }
  // For end time, add 24:00 option (represented as "24:00")
  if (includeEndOfDay) {
    options.push("24:00");
  }
  // For start time, we might want to exclude 00:00 in some cases
  if (!includeStartOfDay) {
    options.shift();
  }
  return options;
}

// Get valid end time options based on start time
export function getValidEndTimeOptions(startTime: string): string[] {
  const allOptions = generateTimeOptions(false, true); // exclude 00:00, include 24:00
  const startMinutes = parseTimeToMinutes(startTime);
  return allOptions.filter((time) => {
    const minutes = parseTimeToMinutes(time);
    return minutes > startMinutes;
  });
}

// Get valid start time options based on end time
export function getValidStartTimeOptions(endTime: string): string[] {
  const allOptions = generateTimeOptions(true, false); // include 00:00, exclude 24:00
  const endMinutes = parseTimeToMinutes(endTime);
  return allOptions.filter((time) => {
    const minutes = parseTimeToMinutes(time);
    return minutes < endMinutes;
  });
}

// Parse time string to minutes
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Format minutes to time string
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Get today's date at midnight (local time)
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Get a reasonable default start time (current time + 2 hours, rounded to 15 min)
// Returns "00:00" if that would push into the next day
export function getDefaultStartTime(): string {
  const now = new Date();
  const targetMinutes = now.getHours() * 60 + now.getMinutes() + 120; // +2 hours

  // If it exceeds today, return 00:00 (user will need to pick tomorrow)
  if (targetMinutes >= 24 * 60) {
    return "00:00";
  }

  // Round up to next 15-minute interval
  const roundedMinutes = Math.ceil(targetMinutes / 15) * 15;

  // Make sure we don't exceed 23:45
  const finalMinutes = Math.min(roundedMinutes, 23 * 60 + 45);

  return formatMinutesToTime(finalMinutes);
}

// Combine date and time into a single Date object
export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// Get initial form data with sensible defaults
export function getInitialFormData(): CreateEventFormData {
  const defaultStartTime = getDefaultStartTime();

  return {
    title: "",
    description: "",
    startDate: getToday(),
    endDate: getToday(),
    startTime: defaultStartTime,
    endTime: "24:00",
    timeZone: "Asia/Taipei",
    votingDeadline: getToday(),
    votingDeadlineTime: defaultStartTime,
    votingDeadlineManuallySet: false,
    lineGroupId: null,
    selectedLineUserIds: [],
  };
}
