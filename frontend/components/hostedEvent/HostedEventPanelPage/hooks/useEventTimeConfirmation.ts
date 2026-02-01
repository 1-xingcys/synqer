"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { EventStatus } from "@/types/event";

interface UseEventTimeConfirmationOptions {
  eventId: string;
  eventStatus: EventStatus;
  confirmedSlotIds?: string[];
  refetch: () => Promise<void>;
}

interface UseEventTimeConfirmationReturn {
  // Add/Remove confirmation state
  isAdding: boolean;
  isRemoving: boolean;
  confirmError: string | null;
  addConfirmedTime: (slotIds: string[]) => Promise<boolean>;
  removeConfirmedTime: (slotIdsToRemove: string[]) => Promise<boolean>;

  // Reset state
  isResetMode: boolean;
  isResetting: boolean;
  resetError: string | null;
  handleResetEventTime: () => Promise<void>;
}

export function useEventTimeConfirmation({
  eventId,
  confirmedSlotIds = [],
  refetch,
}: UseEventTimeConfirmationOptions): UseEventTimeConfirmationReturn {
  const t = useTranslations();

  // Add/Remove state
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Helper function to call confirmation API
  const callConfirmationApi = useCallback(
    async (slotIds: string[]) => {
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

      return response;
    },
    [eventId],
  );

  // Add new time slots to confirmed (merge with existing)
  const addConfirmedTime = useCallback(
    async (newSlotIds: string[]): Promise<boolean> => {
      setIsAdding(true);
      setConfirmError(null);

      try {
        // Merge existing and new slot IDs (remove duplicates)
        const allSlotIds = [...new Set([...confirmedSlotIds, ...newSlotIds])];

        await callConfirmationApi(allSlotIds);

        // Success - refetch data and exit reset mode
        await refetch();
        setIsResetMode(false);

        return true;
      } catch {
        setConfirmError(t("hosted.confirmError"));
        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [confirmedSlotIds, callConfirmationApi, refetch, t],
  );

  // Remove time slots from confirmed
  const removeConfirmedTime = useCallback(
    async (slotIdsToRemove: string[]): Promise<boolean> => {
      setIsRemoving(true);
      setConfirmError(null);

      try {
        // Remove specified slot IDs from existing
        const remainingSlotIds = confirmedSlotIds.filter(
          (id) => !slotIdsToRemove.includes(id),
        );

        if (remainingSlotIds.length === 0) {
          // If no slots remaining, call DELETE API instead
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
        } else {
          await callConfirmationApi(remainingSlotIds);
        }

        // Success - refetch data
        await refetch();

        return true;
      } catch {
        setConfirmError(t("hosted.confirmError"));
        return false;
      } finally {
        setIsRemoving(false);
      }
    },
    [confirmedSlotIds, eventId, callConfirmationApi, refetch, t],
  );

  // Handle reset event time (clear all confirmations)
  const handleResetEventTime = useCallback(async () => {
    setIsResetting(true);
    setResetError(null);

    try {
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

      // Success - enter reset mode
      setIsResetMode(true);

      // Refetch to get updated event status
      await refetch();
    } catch {
      setResetError(t("hosted.resetError"));
    } finally {
      setIsResetting(false);
    }
  }, [eventId, refetch, t]);

  return {
    // Add/Remove
    isAdding,
    isRemoving,
    confirmError,
    addConfirmedTime,
    removeConfirmedTime,

    // Reset
    isResetMode,
    isResetting,
    resetError,
    handleResetEventTime,
  };
}
