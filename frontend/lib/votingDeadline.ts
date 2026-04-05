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
  time: string;
  minDateTime?: Date | null;
  maxDateTime?: Date | null;
}

/**
 * Combine a calendar date and HH:mm string into a single local Date object.
 */
export function combineVotingDeadline(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Shared deadline validation for both create and hosted settings pages.
 * The caller supplies the page-specific lower/upper bounds.
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

  if (!date) {
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
