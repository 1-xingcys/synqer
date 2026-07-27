import type { CalendarDay } from "@/lib/time";

interface VotingDeadlineFields {
  enabled: boolean;
  date: CalendarDay | null;
  time: string | null;
}

/**
 * Shared deadline validation for both create and hosted settings pages.
 *
 * The deadline VALUE is intentionally unconstrained: hosts may set it in the
 * past or past the event start to close/extend voting as they see fit. The
 * only requirement is that enabling the deadline means picking both fields, so
 * a disabled deadline is complete by definition.
 */
export function isVotingDeadlineComplete({
  enabled,
  date,
  time,
}: VotingDeadlineFields): boolean {
  return !enabled || Boolean(date && time);
}
