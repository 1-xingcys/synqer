export const DEFAULT_TIME_ZONE = "Asia/Taipei";

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }

  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour % 24,
    map.minute,
    map.second,
  );
  return asUTC - instant.getTime();
}

export function zonedWallClockToInstant(
  wallClock: Date,
  timeZone: string,
): Date {
  const wall = wallClock.getTime();
  const offset1 = zoneOffsetMs(new Date(wall), timeZone);
  let instant = wall - offset1;
  const offset2 = zoneOffsetMs(new Date(instant), timeZone);
  if (offset2 !== offset1) instant = wall - offset2;
  return new Date(instant);
}

export function instantToZonedWallClock(instant: Date, timeZone: string): Date {
  return new Date(instant.getTime() + zoneOffsetMs(instant, timeZone));
}

/**
 * Render an instant as the product's canonical "yyyy/MM/dd HH:mm" in `timeZone`.
 *
 * Naive wall-clock values (candidate dates, votingDeadline) carry their digits
 * in the UTC fields, so they pass "UTC" here; real instants (createdAt) pass the
 * event's time zone. Formatting either one with the runtime's local zone shifts
 * the displayed time by the viewer's UTC offset.
 */
export function formatDateTimeInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  // h23 can still emit "24" on some engines; normalise it the way zoneOffsetMs does.
  const hour = (Number(map.hour) % 24).toString().padStart(2, "0");
  return `${map.year}/${map.month}/${map.day} ${hour}:${map.minute}`;
}

/** Render an instant as "yyyy/MM/dd" in `timeZone`, dropping the time part. */
export function formatDateInZone(instant: Date, timeZone: string): string {
  return formatDateTimeInZone(instant, timeZone).slice(0, "yyyy/MM/dd".length);
}

/**
 * Parse a grid axis key ("2026-07-30") into a Date whose *local* fields are that
 * calendar day.
 *
 * Date-only strings parse as UTC midnight, so reading them back with local
 * getters lands on the previous day for viewers west of UTC. Anchoring at local
 * noon keeps the calendar day intact in every zone; callers that render axis
 * keys must go through this rather than `new Date(axisKey)`.
 */
export function parseCalendarDayValue(rawValue: string): Date {
  if (rawValue.includes("T")) {
    return new Date(rawValue);
  }

  return new Date(`${rawValue}T12:00:00`);
}

export function resolveDefaultTimeZone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE
    );
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
