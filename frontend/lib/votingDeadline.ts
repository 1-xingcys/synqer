export const VOTING_DEADLINE_ERROR = {
  REQUIRED: "required",
  IN_PAST: "in_past",
  AFTER_MAX: "after_max",
} as const;

export type VotingDeadlineError =
  (typeof VOTING_DEADLINE_ERROR)[keyof typeof VOTING_DEADLINE_ERROR];

interface ValidateVotingDeadlineInput {
  enabled: boolean;
  date: Date | null;
  time: string | null;
  minDateTime?: Date | null;
  maxDateTime?: Date | null;
}

/**
 * Combine a calendar date and HH:mm string into a naive wall-clock Date,
 * encoding the picked day + time into the UTC fields. The event's time zone
 * (event.timeZone) resolves this to a real instant when needed.
 */
export function combineVotingDeadline(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );
}

/**
 * Shared deadline validation for both create and hosted settings pages.
 * The caller supplies the page-specific lower/upper bounds.
 *
 * `deadlineDateTime` (from `combineVotingDeadline`) is a naive wall-clock
 * Date. `minDateTime`/`maxDateTime` must be supplied in the SAME naive
 * wall-clock space (e.g. project a real "now" instant via
 * `instantToZonedWallClock(now, timeZone)` before passing it in) — comparing
 * a naive value against a real instant will skew results by the zone offset.
 */
export function validateVotingDeadline({
  enabled,
  date,
  time,
  minDateTime,
  maxDateTime,
}: ValidateVotingDeadlineInput): VotingDeadlineError | null {
  if (!enabled) {
    return null;
  }

  if (!date || !time) {
    return VOTING_DEADLINE_ERROR.REQUIRED;
  }

  const deadlineDateTime = combineVotingDeadline(date, time);

  if (minDateTime && deadlineDateTime < minDateTime) {
    return VOTING_DEADLINE_ERROR.IN_PAST;
  }

  if (maxDateTime && deadlineDateTime > maxDateTime) {
    return VOTING_DEADLINE_ERROR.AFTER_MAX;
  }

  return null;
}
