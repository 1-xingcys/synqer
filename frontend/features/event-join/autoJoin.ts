import { EventStatus } from "@/types/event";
import { eventDetailPath } from "@/lib/routing/eventRoutes";

export interface AutoJoinState {
  /**
   * Whether a session has resolved. The protected layout renders immediately
   * instead of blocking on /auth/me, so a LIFF entry reaches this page while
   * the login handshake is still in flight.
   */
  isAuthenticated: boolean;
  /** Participation status; null while the check is still in flight. */
  isParticipant: boolean | null;
  eventExists: boolean;
  isDeleted: boolean;
  hasError: boolean;
  /** A join has already been fired for this event in this mount. */
  hasAttempted: boolean;
}

/**
 * Whether opening this event should silently enrol the current user.
 */
export function shouldAutoJoin({
  isAuthenticated,
  isParticipant,
  eventExists,
  isDeleted,
  hasError,
  hasAttempted,
}: AutoJoinState): boolean {
  if (hasAttempted || hasError) return false;
  if (!isAuthenticated) return false;
  if (!eventExists || isDeleted) return false;
  if (isParticipant === null) return false;
  return !isParticipant;
}

/** Where a fresh joiner lands: the vote grid while it is still useful to them. */
export function postJoinRedirectPath(
  eventId: string,
  status: EventStatus,
): string {
  return status === EventStatus.VOTING
    ? eventDetailPath(eventId, "vote")
    : eventDetailPath(eventId);
}
