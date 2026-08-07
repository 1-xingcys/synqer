"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/apiClient";
import { myEventsKeys } from "@/hooks/useMyEvents";
import { eventDetailKeys } from "@/hooks/useEventDetail";
import type { operations } from "@/generated/openapi";
import { eventJoinKeys } from "./queryKeys";
import { shouldAutoJoin } from "./autoJoin";

type JoinEventResponse =
  operations["ParticipationController_joinEvent"]["responses"][200]["content"]["application/json"];

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

export interface UseAutoJoinEventOptions {
  /** The join request sits behind SessionAuthGuard, so this must be true. */
  isAuthenticated: boolean;
  /** null while the participation check is still unresolved. */
  isParticipant: boolean | null;
  eventExists: boolean;
  isDeleted: boolean;
  /** Runs once the join has landed and the affected queries are stale. */
  onJoined?: () => void;
}

export interface UseAutoJoinEventResult {
  joinError: string | null;
  retryJoin: () => void;
}

/**
 * Enrols the current user in an event they opened but are not part of.
 *
 * Fires at most once per mount. Retrying clears the error, which lets the
 * effect run again.
 */
export function useAutoJoinEvent(
  eventId: string,
  {
    isAuthenticated,
    isParticipant,
    eventExists,
    isDeleted,
    onJoined,
  }: UseAutoJoinEventOptions,
): UseAutoJoinEventResult {
  const queryClient = useQueryClient();
  const [joinError, setJoinError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  const { mutate: join } = useMutation({
    mutationFn: () => joinEvent(eventId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myEventsKeys.all }),
        queryClient.invalidateQueries({
          queryKey: eventDetailKeys.detail(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: eventJoinKeys.participation(eventId),
        }),
      ]);
      onJoined?.();
    },
    onError: (error) => {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join event",
      );
    },
  });

  const retryJoin = useCallback(() => {
    attemptedRef.current = false;
    setJoinError(null);
  }, []);

  useEffect(() => {
    const ready = shouldAutoJoin({
      isAuthenticated,
      isParticipant,
      eventExists,
      isDeleted,
      hasError: !!joinError,
      hasAttempted: attemptedRef.current,
    });

    if (!ready) return;

    attemptedRef.current = true;
    join();
  }, [isAuthenticated, isParticipant, eventExists, isDeleted, joinError, join]);

  return { joinError, retryJoin };
}
