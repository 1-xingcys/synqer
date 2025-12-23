"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { EventStatus } from "@/types/event";

interface UseEventTimeConfirmationOptions {
  eventId: string;
  eventStatus: EventStatus;
  getAllSelectedSlotIds: () => string[];
  clearSelections: () => void;
  refetch: () => Promise<void>;
}

interface UseEventTimeConfirmationReturn {
  // Confirmation state
  isConfirming: boolean;
  confirmError: string | null;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  handleConfirmClick: () => void;
  handleConfirmEventTime: () => Promise<void>;

  // Reset state
  isResetMode: boolean;
  isResetting: boolean;
  resetError: string | null;
  handleResetEventTime: () => Promise<void>;
}

export function useEventTimeConfirmation({
  eventId,
  eventStatus,
  getAllSelectedSlotIds,
  clearSelections,
  refetch,
}: UseEventTimeConfirmationOptions): UseEventTimeConfirmationReturn {
  const t = useTranslations();
  const router = useRouter();

  // Confirmation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Handle actual confirmation to backend
  const handleConfirmEventTime = useCallback(async () => {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const slotIds = getAllSelectedSlotIds();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/confirm-time`,
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
        throw new Error("Failed to confirm time");
      }

      // Success - refetch data and clear selection
      await refetch();
      clearSelections();
      setIsResetMode(false);
      setShowConfirmDialog(false);

      // Optionally redirect to the event page
      router.push(`/hosted/${eventId}`);
    } catch {
      setConfirmError(t("hosted.confirmError"));
    } finally {
      setIsConfirming(false);
    }
  }, [eventId, getAllSelectedSlotIds, refetch, clearSelections, router, t]);

  // Handle confirm button click
  const handleConfirmClick = useCallback(() => {
    const isVotingPhase = eventStatus === EventStatus.VOTING;

    if (isVotingPhase) {
      // Show confirmation dialog for voting phase
      setShowConfirmDialog(true);
    } else {
      // Direct confirm for voting-ended phase
      void handleConfirmEventTime();
    }
  }, [eventStatus, handleConfirmEventTime]);

  // Handle reset event time (clear all selections and call API)
  const handleResetEventTime = useCallback(async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/confirm-time`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reset event time");
      }

      // Success - clear local selections and enter reset mode
      clearSelections();
      setIsResetMode(true);

      // Refetch to get updated event status
      await refetch();
    } catch {
      setResetError(t("hosted.resetError"));
    } finally {
      setIsResetting(false);
    }
  }, [eventId, clearSelections, refetch, t]);

  return {
    // Confirmation
    isConfirming,
    confirmError,
    showConfirmDialog,
    setShowConfirmDialog,
    handleConfirmClick,
    handleConfirmEventTime,

    // Reset
    isResetMode,
    isResetting,
    resetError,
    handleResetEventTime,
  };
}
