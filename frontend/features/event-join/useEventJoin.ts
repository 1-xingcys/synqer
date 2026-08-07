"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { apiFetch, apiFetchJson } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import type { operations } from "@/generated/openapi";
import { normalizeEventPublicInfoResponse } from "@/lib/event-normalizers";
import { eventJoinKeys } from "./queryKeys";
import { useAutoJoinEvent } from "./useAutoJoinEvent";
import { postJoinRedirectPath } from "./autoJoin";

type EventPublicInfoResponse =
  operations["EventCoreController_getEventPublicInfo"]["responses"][200]["content"]["application/json"];
export type EventPublicInfo = ReturnType<
  typeof normalizeEventPublicInfoResponse
>;
type ParticipationStatus =
  operations["ParticipationController_checkParticipantStatus"]["responses"][200]["content"]["application/json"];

export interface UseEventJoinResult {
  eventInfo: EventPublicInfo | null;
  isParticipant: boolean | null;
  loading: boolean;
  /** Failure loading the event itself; not recoverable by retrying the join. */
  error: string | null;
  joinError: string | null;
  retryJoin: () => void;
}

async function fetchEventPublicInfo(
  eventId: string,
): Promise<EventPublicInfoResponse> {
  return apiFetchJson<EventPublicInfoResponse>(`/events/${eventId}/public`, {
    credentials: "omit",
  });
}

async function fetchParticipationStatus(
  eventId: string,
): Promise<ParticipationStatus | null> {
  const response = await apiFetch(`/events/${eventId}/participation`);

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<ParticipationStatus>;
}

/**
 * Backs the bare event link: resolves the event, enrols whoever opened it and
 * reports what the page should show while that happens.
 */
export function useEventJoin(eventId: string): UseEventJoinResult {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const eventQuery = useQuery({
    queryKey: eventJoinKeys.public(eventId),
    queryFn: () => fetchEventPublicInfo(eventId),
    select: normalizeEventPublicInfoResponse,
    enabled: !!eventId,
  });

  const eventInfo = eventQuery.data ?? null;

  // Gated on the session: without one this endpoint answers 401, which
  // fetchParticipationStatus would flatten into an indistinguishable "no".
  const participationQuery = useQuery({
    queryKey: eventJoinKeys.participation(eventId),
    queryFn: () => fetchParticipationStatus(eventId),
    enabled:
      !!eventId && !!eventInfo && !eventInfo.isDeleted && isAuthenticated,
  });

  // A settled-but-empty response now means the check failed while holding a
  // valid session; treat that as "not a participant" and let the join answer.
  const isParticipant = participationQuery.isSuccess
    ? (participationQuery.data?.isParticipant ?? false)
    : null;

  const status = eventInfo?.status;
  const onJoined = useCallback(() => {
    if (!status) return;
    router.replace(postJoinRedirectPath(eventId, status));
  }, [eventId, router, status]);

  const { joinError, retryJoin } = useAutoJoinEvent(eventId, {
    isAuthenticated,
    isParticipant,
    eventExists: !!eventInfo,
    isDeleted: !!eventInfo?.isDeleted,
    onJoined,
  });

  const loading =
    authLoading || eventQuery.isLoading || participationQuery.isLoading;
  const error = useMemo(() => {
    if (eventQuery.error) return eventQuery.error.message;
    if (participationQuery.error) return participationQuery.error.message;
    return null;
  }, [eventQuery.error, participationQuery.error]);

  return {
    eventInfo,
    isParticipant,
    loading,
    error,
    joinError,
    retryJoin,
  };
}
