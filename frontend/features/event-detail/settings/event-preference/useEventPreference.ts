"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  hostedEventKeys,
  useHostedEventDetail,
} from "@/hooks/useHostedEventDetail";
import { eventDetailKeys } from "@/hooks/useEventDetail";
import { apiFetchJson } from "@/lib/api/apiClient";
import type { operations } from "@/generated/openapi";
import { VoteMode, type TimeGranularity } from "@/types/event";
import {
  DEFAULT_GRANULARITY,
  DEFAULT_SHARE_VOTE_TO_CHAT,
  DEFAULT_VOTE_MODE,
  normalizeGranularity,
  normalizeShareVoteToChat,
  toVoteMode,
  toVoteModeDto,
} from "@/lib/event/eventPreference";

type UpdateEventRequest =
  operations["EventCoreController_update"]["requestBody"]["content"]["application/json"];
type UpdateEventResponse =
  operations["EventCoreController_update"]["responses"][200]["content"]["application/json"];
/** The cache holds the raw response; `useHostedEventDetail` normalizes on read. */
type RawHostedEventDetail =
  operations["EventCoreController_findOneHosted"]["responses"][200]["content"]["application/json"];

const MUTATION_KEY = ["eventPreference"] as const;

/**
 * The host-controlled event preferences, backing both settings sections.
 *
 * They share one hook because they share one endpoint and one optimistic
 * write; the sections differ in what they mean to a participant, not in how
 * they are saved. Every toggle writes immediately: none of them is worth
 * staging behind a save button.
 */
export function useEventPreference() {
  const params = useParams();
  const eventId = params.eventId as string;
  const queryClient = useQueryClient();
  const queryKey = hostedEventKeys.detail(eventId);

  const { data, isLoading } = useHostedEventDetail(eventId);
  const event = data?.event ?? null;

  const mutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: (payload: UpdateEventRequest) =>
      apiFetchJson<UpdateEventResponse>(`/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData =
        queryClient.getQueryData<RawHostedEventDetail>(queryKey);

      queryClient.setQueryData<RawHostedEventDetail>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          event: {
            ...old.event,
            ...(payload.defaultGranularityMin !== undefined && {
              defaultGranularityMin: payload.defaultGranularityMin,
            }),
            ...(payload.defaultVoteMode !== undefined && {
              defaultVoteMode: payload.defaultVoteMode,
            }),
            ...(payload.shareVoteToChat !== undefined && {
              shareVoteToChat: payload.shareVoteToChat,
            }),
          },
        };
      });

      return { previousData };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // A rapid second toggle is still optimistically applied; refetching only
      // after the last one keeps the earlier server state from flashing back.
      if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) > 1) return;

      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });
    },
  });

  const { mutate } = mutation;

  const setGranularity = useCallback(
    (granularity: TimeGranularity) => {
      mutate({ defaultGranularityMin: granularity });
    },
    [mutate],
  );

  const setVoteMode = useCallback(
    (voteMode: VoteMode) => {
      mutate({ defaultVoteMode: toVoteModeDto(voteMode) });
    },
    [mutate],
  );

  const setShareVoteToChat = useCallback(
    (shareVoteToChat: boolean) => {
      mutate({ shareVoteToChat });
    },
    [mutate],
  );

  return {
    isLoading: isLoading && !event,
    granularity: event
      ? normalizeGranularity(event.defaultGranularityMin)
      : DEFAULT_GRANULARITY,
    voteMode: event ? toVoteMode(event.defaultVoteMode) : DEFAULT_VOTE_MODE,
    shareVoteToChat: event
      ? normalizeShareVoteToChat(event.shareVoteToChat)
      : DEFAULT_SHARE_VOTE_TO_CHAT,
    // Each section calls this hook separately, so this observer only ever sees
    // its own section's failures — the message lands where the toggle was.
    hasError: mutation.isError,
    setGranularity,
    setVoteMode,
    setShareVoteToChat,
  };
}
