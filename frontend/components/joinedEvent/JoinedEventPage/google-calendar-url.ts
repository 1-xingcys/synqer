import { zonedWallClockToInstant } from "@/lib/time";

/**
 * Format a confirmed selection's date for a Google Calendar URL.
 *
 * `dateStr` is a NAIVE wall-clock value: a Date whose UTC fields carry the
 * wall-clock digits in `timeZone` (e.g. "2026-07-13T09:00:00Z" means
 * wall-clock 09:00 in `timeZone`, not 09:00 UTC).
 *
 * We resolve that naive value to the real UTC instant via
 * `zonedWallClockToInstant`, then format the instant's UTC fields as
 * `YYYYMMDDTHHMMSS` and append `Z`. Google Calendar interprets a `Z`-suffixed
 * date as UTC, so the created event lands at the correct instant regardless
 * of the viewer's own Google Calendar timezone.
 */
export function formatGoogleCalendarDate(
  dateStr: string,
  timeZone: string,
): string {
  const wallClock = new Date(dateStr);
  const instant = zonedWallClockToInstant(wallClock, timeZone);

  const year = instant.getUTCFullYear();
  const month = String(instant.getUTCMonth() + 1).padStart(2, "0");
  const day = String(instant.getUTCDate()).padStart(2, "0");
  const hours = String(instant.getUTCHours()).padStart(2, "0");
  const minutes = String(instant.getUTCMinutes()).padStart(2, "0");
  const seconds = String(instant.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate Google Calendar URL for adding an event
 */
export function generateGoogleCalendarUrl(
  title: string,
  description: string | undefined,
  startTime: string,
  endTime: string,
  timeZone: string,
): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleCalendarDate(startTime, timeZone)}/${formatGoogleCalendarDate(endTime, timeZone)}`,
  });

  if (description) {
    params.set("details", description);
  }

  return `${baseUrl}?${params.toString()}`;
}
