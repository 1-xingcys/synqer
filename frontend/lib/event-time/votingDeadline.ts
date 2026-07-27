import type { CalendarDay } from "@/lib/time";
import { wallClockToDate, type WallClock } from "@/lib/time";
import { formatDateTimeInZone } from "@/lib/time";

export const VOTING_DEADLINE_ERROR = {
  REQUIRED: "required",
} as const;

export type VotingDeadlineError =
  (typeof VOTING_DEADLINE_ERROR)[keyof typeof VOTING_DEADLINE_ERROR];

interface ValidateVotingDeadlineInput {
  enabled: boolean;
  date: CalendarDay | null;
  time: string | null;
}

/**
 * The stored value carries the picked wall-clock digits in its UTC fields, so it
 * must be read back in UTC. Reading it in the viewer's zone shifts the deadline
 * by their UTC offset. See `calendarDayToWallClock` for the inverse.
 */
export function formatVotingDeadlineWallClock(
  votingDeadline: WallClock,
): string {
  return formatDateTimeInZone(wallClockToDate(votingDeadline), "UTC");
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
