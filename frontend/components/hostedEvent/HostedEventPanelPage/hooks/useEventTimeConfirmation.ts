"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EventStatus } from "@/types/event";
import {
  hostedEventKeys,
  HostedEventDetailData,
} from "@/hooks/useHostedEventDetail";

interface UseEventTimeConfirmationOptions {
  eventId: string;
  eventStatus: EventStatus;
  confirmedSlotIds?: string[];
}

interface UseEventTimeConfirmationReturn {
  // Add/Remove confirmation
  confirmError: string | null;
  addConfirmedTime: (slotIds: string[]) => Promise<boolean>;
  removeConfirmedTime: (slotIdsToRemove: string[]) => Promise<boolean>;

  // Reset
  isResetMode: boolean;
  resetError: string | null;
  handleResetEventTime: () => Promise<void>;
}

// API functions
async function confirmTimeApi(
  eventId: string,
  slotIds: string[],
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/confirmation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ slotIds }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update confirmed time");
  }
}

async function deleteConfirmationApi(eventId: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/confirmation`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to reset event time");
  }
}

export function useEventTimeConfirmation({
  eventId,
  confirmedSlotIds = [],
}: UseEventTimeConfirmationOptions): UseEventTimeConfirmationReturn {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const queryKey = hostedEventKeys.detail(eventId);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [isResetMode, setIsResetMode] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (newSlotIds: string[]) => {
      const allSlotIds = [...new Set([...confirmedSlotIds, ...newSlotIds])];
      await confirmTimeApi(eventId, allSlotIds);
      return allSlotIds;
    },
    onMutate: async (newSlotIds) => {
      setConfirmError(null);
      await queryClient.cancelQueries({ queryKey });

      const previousData =
        queryClient.getQueryData<HostedEventDetailData>(queryKey);

      // 樂觀更新：只更新 confirmedSlotIds
      if (previousData) {
        const allSlotIds = [...new Set([...confirmedSlotIds, ...newSlotIds])];
        queryClient.setQueryData<HostedEventDetailData>(queryKey, {
          ...previousData,
          event: {
            ...previousData.event,
            confirmedSlotIds: allSlotIds,
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setConfirmError(t("hosted.confirmError"));
    },
    onSuccess: () => {
      setIsResetMode(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (slotIdsToRemove: string[]) => {
      const remainingSlotIds = confirmedSlotIds.filter(
        (id) => !slotIdsToRemove.includes(id),
      );

      if (remainingSlotIds.length === 0) {
        await deleteConfirmationApi(eventId);
      } else {
        await confirmTimeApi(eventId, remainingSlotIds);
      }

      return remainingSlotIds;
    },
    onMutate: async (slotIdsToRemove) => {
      setConfirmError(null);
      await queryClient.cancelQueries({ queryKey });

      const previousData =
        queryClient.getQueryData<HostedEventDetailData>(queryKey);

      if (previousData) {
        const slotIdsToRemoveSet = new Set(slotIdsToRemove);
        const remainingSlotIds = confirmedSlotIds.filter(
          (id) => !slotIdsToRemoveSet.has(id),
        );
        const remainingTimeRanges = (
          previousData.event.confirmedTimeRanges ?? []
        ).filter(
          (range) => !range.slotIds.some((id) => slotIdsToRemoveSet.has(id)),
        );
        queryClient.setQueryData<HostedEventDetailData>(queryKey, {
          ...previousData,
          event: {
            ...previousData.event,
            confirmedSlotIds: remainingSlotIds,
            confirmedTimeRanges: remainingTimeRanges,
          },
        });
      }

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

  const resetMutation = useMutation({
    mutationFn: async () => {
      await deleteConfirmationApi(eventId);
    },
    onMutate: async () => {
      setResetError(null);
      await queryClient.cancelQueries({ queryKey });

      const previousData =
        queryClient.getQueryData<HostedEventDetailData>(queryKey);

      if (previousData) {
        queryClient.setQueryData<HostedEventDetailData>(queryKey, {
          ...previousData,
          event: {
            ...previousData.event,
            confirmedSlotIds: [],
            confirmedTimeRanges: [],
          },
        });
      }

      setIsResetMode(true);
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setIsResetMode(false);
      setResetError(t("hosted.resetError"));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  // Wrapper functions - trigger mutation and return immediately for optimistic UX
  const addConfirmedTime = useCallback(
    (slotIds: string[]): Promise<boolean> => {
      addMutation.mutate(slotIds);
      return Promise.resolve(true);
    },
    [addMutation],
  );

  const removeConfirmedTime = useCallback(
    (slotIdsToRemove: string[]): Promise<boolean> => {
      removeMutation.mutate(slotIdsToRemove);
      return Promise.resolve(true);
    },
    [removeMutation],
  );

  const handleResetEventTime = useCallback(() => {
    resetMutation.mutate();
    return Promise.resolve();
  }, [resetMutation]);

  return {
    // Add/Remove
    confirmError,
    addConfirmedTime,
    removeConfirmedTime,

    // Reset
    isResetMode,
    resetError,
    handleResetEventTime,
  };
}
