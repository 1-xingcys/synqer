import { isVotingDeadlineComplete } from "@/lib/votingDeadline";
import { calendarDayToWallClock, type CalendarDay } from "@/lib/time";
import { wallClockDay, wallClockTime, type WallClock } from "@/lib/time";
import { EventStatus } from "@/types/event";

export interface VotingDeadlineFormData {
  deadlineEnabled: boolean;
  deadlineDate: CalendarDay | null;
  deadlineTime: string | null;
}

export const EMPTY_VOTING_DEADLINE_FORM_DATA: VotingDeadlineFormData = {
  deadlineEnabled: false,
  deadlineDate: null,
  deadlineTime: null,
};

export function areVotingDeadlineFormsEqual(
  left: VotingDeadlineFormData,
  right: VotingDeadlineFormData,
): boolean {
  if (left.deadlineEnabled !== right.deadlineEnabled) {
    return false;
  }

  if (!left.deadlineEnabled) {
    return true;
  }

  return (
    left.deadlineTime === right.deadlineTime &&
    left.deadlineDate === right.deadlineDate
  );
}

export function buildVotingDeadlineFormData(
  votingDeadline?: WallClock | null,
): VotingDeadlineFormData {
  if (votingDeadline) {
    const time = wallClockTime(votingDeadline);
    const deadlineDate = wallClockDay(votingDeadline);

    return {
      deadlineEnabled: true,
      deadlineDate,
      deadlineTime: time,
    };
  }

  return { ...EMPTY_VOTING_DEADLINE_FORM_DATA };
}

type DeadlineLockableEvent = {
  status: EventStatus;
};

/**
 * The deadline is only locked once the event time is confirmed, mirroring the
 * API's single update guard. An event that merely started is still collecting
 * votes, so the host keeps control over the deadline.
 */
export function isVotingDeadlineLocked(
  event: DeadlineLockableEvent | null | undefined,
): boolean {
  if (!event) {
    return false;
  }

  return (
    event.status === EventStatus.CONFIRMED ||
    event.status === EventStatus.COMPLETED
  );
}

/** Reuse the same validation engine as the create page, in this form's shape. */
export function isVotingDeadlineFormComplete(
  formData: VotingDeadlineFormData,
): boolean {
  return isVotingDeadlineComplete({
    enabled: formData.deadlineEnabled,
    date: formData.deadlineDate,
    time: formData.deadlineTime,
  });
}

/**
 * Turn the form into the PATCH payload:
 * - `null` clears the deadline
 * - an ISO string sets it
 * - `undefined` leaves it untouched (enabled but not fully filled in)
 */
export function toVotingDeadlinePayload(
  formData: VotingDeadlineFormData,
): string | null | undefined {
  if (!formData.deadlineEnabled) {
    return null;
  }

  if (formData.deadlineDate && formData.deadlineTime) {
    return calendarDayToWallClock(formData.deadlineDate, formData.deadlineTime);
  }

  return undefined;
}
