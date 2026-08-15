"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchJson, apiFetchVoid } from "@/lib/api/apiClient";
import type { operations } from "@/generated/openapi";
import {
  hostedEventKeys,
  HostedEventDetailData,
} from "@/hooks/useHostedEventDetail";
import type { StagedConfirmation } from "@/types/event";

interface UseEventTimeConfirmationOptions {
  eventId: string;
  confirmedSlotIds?: string[];
  stagedConfirmation?: StagedConfirmation | null;
}

interface UseEventTimeConfirmationReturn {
  confirmError: string | null;
  addConfirmedTime: (slotIds: string[]) => Promise<boolean>;
  removeConfirmedTime: (slotIdsToRemove: string[]) => Promise<boolean>;
  commitStagedConfirmation: () => Promise<void>;
  discardStagedConfirmation: () => Promise<void>;
  isPatchPending: boolean;
  isCommitPending: boolean;
  isDiscardPending: boolean;
}

type UpdateStagedConfirmationRequest =
  operations["ConfirmationController_updateStagedConfirmation"]["requestBody"]["content"]["application/json"];
type CommitStagedConfirmationResponse =
  operations["ConfirmationController_commitStagedConfirmation"]["responses"][200]["content"]["application/json"];

function orderByAllSlotIds(
  slotIds: Set<string>,
  allSlotIds: string[],
): string[] {
  return allSlotIds.filter((slotId) => slotIds.has(slotId));
}

function areOrderedSlotIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((slotId, index) => slotId === right[index]);
}

async function patchStagedConfirmationApi(
  eventId: string,
  addSlotIds: string[],
  removeSlotIds: string[],
): Promise<void> {
  const payload: UpdateStagedConfirmationRequest = {
    addSlotIds,
    removeSlotIds,
  };

  await apiFetchVoid(`/events/${eventId}/confirmation/staged`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function commitStagedConfirmationApi(
  eventId: string,
): Promise<CommitStagedConfirmationResponse> {
  return apiFetchJson<CommitStagedConfirmationResponse>(
    `/events/${eventId}/confirmation/commit`,
    {
      method: "POST",
    },
  );
}

async function discardStagedConfirmationApi(eventId: string): Promise<void> {
  await apiFetchVoid(`/events/${eventId}/confirmation/staged`, {
    method: "DELETE",
  });
}

export function useEventTimeConfirmation({
  eventId,
  confirmedSlotIds = [],
  stagedConfirmation = null,
}: UseEventTimeConfirmationOptions): UseEventTimeConfirmationReturn {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const queryKey = hostedEventKeys.detail(eventId);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const patchMutation = useMutation({
    mutationFn: ({
      addSlotIds,
      removeSlotIds,
    }: {
      addSlotIds: string[];
      removeSlotIds: string[];
    }) => patchStagedConfirmationApi(eventId, addSlotIds, removeSlotIds),
    onMutate: async () => {
      setConfirmError(null);
      await queryClient.cancelQueries({ queryKey });
    },
    onSuccess: (_response, { addSlotIds, removeSlotIds }) => {
      queryClient.setQueryData<HostedEventDetailData>(queryKey, (old) => {
        if (!old) return old;

        const allSlotIds = old.slots.map((slot) => slot.id);
        const baselineSlotIds =
          old.stagedConfirmation?.baselineSlotIds ?? old.event.confirmedSlotIds;
        const nextSlotIds = new Set(
          old.stagedConfirmation?.slotIds ?? old.event.confirmedSlotIds,
        );

        addSlotIds.forEach((slotId) => nextSlotIds.add(slotId));
        removeSlotIds.forEach((slotId) => nextSlotIds.delete(slotId));

        const orderedNextSlotIds = orderByAllSlotIds(nextSlotIds, allSlotIds);
        const orderedBaselineSlotIds = orderByAllSlotIds(
          new Set(baselineSlotIds),
          allSlotIds,
        );

        if (
          areOrderedSlotIdsEqual(orderedNextSlotIds, orderedBaselineSlotIds)
        ) {
          return {
            ...old,
            stagedConfirmation: null,
          };
        }

        return {
          ...old,
          stagedConfirmation: {
            slotIds: orderedNextSlotIds,
            baselineSlotIds: orderedBaselineSlotIds,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    onError: () => {
      setConfirmError(t("hosted.confirmError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const commitMutation = useMutation({
    mutationFn: async () => commitStagedConfirmationApi(eventId),
    onMutate: () => {
      setConfirmError(null);
    },
    onSuccess: (response) => {
      queryClient.setQueryData<HostedEventDetailData>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          event: {
            ...old.event,
            confirmedSlotIds: response.confirmedSlotIds,
            status: response.status,
          },
          stagedConfirmation: null,
        };
      });
    },
    onError: () => {
      setConfirmError(t("hosted.confirmError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const discardMutation = useMutation({
    mutationFn: async () => discardStagedConfirmationApi(eventId),
    onMutate: async () => {
      setConfirmError(null);
      await queryClient.cancelQueries({ queryKey });

      const previousData =
        queryClient.getQueryData<HostedEventDetailData>(queryKey);

      queryClient.setQueryData<HostedEventDetailData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          stagedConfirmation: null,
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setConfirmError(t("hosted.confirmError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const addConfirmedTime = useCallback(
    async (slotIds: string[]): Promise<boolean> => {
      if (
        patchMutation.isPending ||
        commitMutation.isPending ||
        discardMutation.isPending
      ) {
        return false;
      }

      const currentSlotIds = new Set(
        stagedConfirmation?.slotIds ?? confirmedSlotIds,
      );
      const addSlotIds = slotIds.filter(
        (slotId) => !currentSlotIds.has(slotId),
      );
      if (addSlotIds.length === 0) return true;

      try {
        await patchMutation.mutateAsync({ addSlotIds, removeSlotIds: [] });
        return true;
      } catch {
        return false;
      }
    },
    [
      commitMutation.isPending,
      confirmedSlotIds,
      discardMutation.isPending,
      patchMutation,
      stagedConfirmation,
    ],
  );

  const removeConfirmedTime = useCallback(
    async (slotIdsToRemove: string[]): Promise<boolean> => {
      if (
        patchMutation.isPending ||
        commitMutation.isPending ||
        discardMutation.isPending
      ) {
        return false;
      }

      const currentSlotIds = new Set(
        stagedConfirmation?.slotIds ?? confirmedSlotIds,
      );
      const removeSlotIds = slotIdsToRemove.filter((slotId) =>
        currentSlotIds.has(slotId),
      );
      if (removeSlotIds.length === 0) return true;

      try {
        await patchMutation.mutateAsync({ addSlotIds: [], removeSlotIds });
        return true;
      } catch {
        return false;
      }
    },
    [
      commitMutation.isPending,
      confirmedSlotIds,
      discardMutation.isPending,
      patchMutation,
      stagedConfirmation,
    ],
  );

  const handleCommit = useCallback(() => {
    if (
      patchMutation.isPending ||
      commitMutation.isPending ||
      discardMutation.isPending
    ) {
      return Promise.resolve();
    }
    commitMutation.mutate();
    return Promise.resolve();
  }, [commitMutation, discardMutation, patchMutation]);

  const handleDiscard = useCallback(() => {
    if (
      patchMutation.isPending ||
      commitMutation.isPending ||
      discardMutation.isPending
    ) {
      return Promise.resolve();
    }
    discardMutation.mutate();
    return Promise.resolve();
  }, [commitMutation, discardMutation, patchMutation]);

  return {
    confirmError,
    addConfirmedTime,
    removeConfirmedTime,
    commitStagedConfirmation: handleCommit,
    discardStagedConfirmation: handleDiscard,
    isPatchPending: patchMutation.isPending,
    isCommitPending: commitMutation.isPending,
    isDiscardPending: discardMutation.isPending,
  };
}
