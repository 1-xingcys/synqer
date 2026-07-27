import { formatDateTimeInZone } from "@/lib/time";

export const VOTING_DEADLINE_ERROR = {
  REQUIRED: "required",
} as const;

export type VotingDeadlineError =
  (typeof VOTING_DEADLINE_ERROR)[keyof typeof VOTING_DEADLINE_ERROR];

interface ValidateVotingDeadlineInput {
  enabled: boolean;
  date: Date | null;
  time: string | null;
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
 * Inverse of {@link combineVotingDeadline}: the stored value carries the picked
 * wall-clock digits in its UTC fields, so it must be read back in UTC. Reading
 * it in the viewer's zone shifts the deadline by their UTC offset.
 */
export function formatVotingDeadlineWallClock(
  votingDeadline: string | Date,
): string {
  return formatDateTimeInZone(new Date(votingDeadline), "UTC");
}

/**
 * Shared deadline validation for both create and hosted settings pages.
 *
 * The deadline VALUE is intentionally unconstrained: hosts may set it in the
 * past or past the event start to close/extend voting as they see fit. The
 * only requirement is that enabling the deadline means picking both fields.
 */
export function validateVotingDeadline({
  enabled,
  date,
  time,
}: ValidateVotingDeadlineInput): VotingDeadlineError | null {
  if (!enabled) {
    return null;
  }

  if (!date || !time) {
    return VOTING_DEADLINE_ERROR.REQUIRED;
  }

  return null;
}
