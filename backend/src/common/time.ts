/**
 * The application's canonical time zone.
 *
 * Event-domain times (slots, startDate/endDate, confirmed selections) are stored
 * as "wall-clock encoded as UTC": e.g. 09:00 is persisted as `...T09:00:00Z`, and
 * read back with UTC getters so the digits survive regardless of server locale.
 * This zone is only needed to interpret such timezone-naive wall-clock values
 * against the real clock.
 */
export const DEFAULT_TIME_ZONE = 'Asia/Taipei';

/**
 * Project a real instant into the app's wall-clock, encoded as UTC.
 *
 * Comparing a stored wall-clock-as-UTC value against the real clock requires
 * `now` in the same space: the current wall-clock in {@link DEFAULT_TIME_ZONE},
 * with those digits placed into the UTC fields. For example, a real instant of
 * 02:00Z (10:00 in Asia/Taipei) is returned as `...T10:00:00Z`.
 */
export function appWallClockNow(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  // hour12:false can emit "24" for midnight in some engines; normalize to 0.
  const hour = get('hour') % 24;

  return new Date(
    Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      hour,
      get('minute'),
      get('second'),
    ),
  );
}
