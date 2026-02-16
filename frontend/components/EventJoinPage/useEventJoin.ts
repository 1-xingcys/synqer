"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { ApiError, apiFetch, apiFetchJson } from "@/lib/apiClient";
import { attendedEventsKeys } from "@/hooks/useAttendedEvents";
import type { operations } from "@/generated/openapi";

type EventPublicInfoResponse =
  operations["EventCoreController_getEventPublicInfo"]["responses"][200]["content"]["application/json"];
export type EventPublicInfo = EventPublicInfoResponse;
type ParticipationStatusResponse =
  operations["ParticipationController_checkParticipantStatus"]["responses"][200]["content"]["application/json"];
type JoinEventResponse =
  operations["ParticipationController_joinEvent"]["responses"][200]["content"]["application/json"];
export type ParticipationStatus = ParticipationStatusResponse;

export interface UseEventJoinResult {
  eventInfo: EventPublicInfo | null;
  participationStatus: ParticipationStatus | null;
  loading: boolean;
  joining: boolean;
  error: string | null;
  handleJoin: () => Promise<void>;
}

const eventJoinKeys = {
  all: ["eventJoin"] as const,
  public: (eventId: string) =>
    [...eventJoinKeys.all, "public", eventId] as const,
  participation: (eventId: string) =>
    [...eventJoinKeys.all, "participation", eventId] as const,
};

async function fetchEventPublicInfo(eventId: string): Promise<EventPublicInfo> {
  return apiFetchJson<EventPublicInfo>(`/events/${eventId}/public`, {
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

async function joinEvent(eventId: string): Promise<JoinEventResponse> {
  const response = await apiFetch(`/events/${eventId}/participation/join`, {
    method: "POST",
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to join event";
    if (response.status >= 500) {
      throw new Error(fallbackMessage);
    }

    const payload = (await response.json().catch(() => undefined)) as
      | { message?: string }
      | undefined;
    throw new ApiError(
      payload?.message || fallbackMessage,
      response.status,
      payload,
    );
  }

  return response.json() as Promise<JoinEventResponse>;
}

export function useEventJoin(eventId: string): UseEventJoinResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [joinError, setJoinError] = useState<string | null>(null);

  const eventQuery = useQuery({
    queryKey: eventJoinKeys.public(eventId),
    queryFn: () => fetchEventPublicInfo(eventId),
    enabled: !!eventId,
  });

  const participationQuery = useQuery({
    queryKey: eventJoinKeys.participation(eventId),
    queryFn: () => fetchParticipationStatus(eventId),
    enabled: !!eventId && !!eventQuery.data && !eventQuery.data.isDeleted,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinEvent(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendedEventsKeys.all });
      router.push(`/joined/${eventId}`);
    },
    onError: (error) => {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join event",
      );
    },
  });

  const handleJoin = useCallback(async () => {
    setJoinError(null);
    try {
      await joinMutation.mutateAsync();
    } catch {
      // Error state is handled via joinError.
    }
  }, [joinMutation]);

  const loading = eventQuery.isLoading || participationQuery.isLoading;
  const error = useMemo(() => {
    if (joinError) return joinError;
    if (eventQuery.error) return eventQuery.error.message;
    if (participationQuery.error) return participationQuery.error.message;
    return null;
  }, [joinError, eventQuery.error, participationQuery.error]);

  return {
    eventInfo: eventQuery.data ?? null,
    participationStatus: participationQuery.data ?? null,
    loading,
    joining: joinMutation.isPending,
    error,
    handleJoin,
  };
}
