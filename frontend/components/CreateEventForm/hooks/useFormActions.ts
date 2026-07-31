"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { calendarDayToWallClock } from "@/lib/time";
import { toVoteModeDto } from "@/lib/eventPreference";
import { useLiffContext } from "@/contexts/LiffContext";
import { apiFetchJson } from "@/lib/apiClient";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";
import type { operations } from "@/generated/openapi";
import { CreateEventFormData } from "../types";
import { getCreateEventValidationErrors } from "./useFormValidation";

interface UseFormActionsProps {
  formData: CreateEventFormData;
  hasUnsavedChanges: boolean;
  refreshValidation: () => void;
  setLoading: (loading: boolean) => void;
  setShowCancelConfirm: (show: boolean) => void;
}

type CreateEventRequest =
  operations["EventCoreController_create"]["requestBody"]["content"]["application/json"];
type CreateEventResponse =
  operations["EventCoreController_create"]["responses"][201]["content"]["application/json"];

export function useFormActions({
  formData,
  hasUnsavedChanges,
  refreshValidation,
  setLoading,
  setShowCancelConfirm,
}: UseFormActionsProps) {
  const router = useRouter();
  const { isInClient: isInLiff, closeWindow } = useLiffContext();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const latestErrors = getCreateEventValidationErrors(formData, new Date());

      if (latestErrors.size > 0) {
        refreshValidation();
        return;
      }

      setLoading(true);

      try {
        const isRecurring = formData.eventType === "RECURRING";

        // Defensive null check for required fields
        if (!isRecurring && (!formData.startDate || !formData.endDate)) {
          console.error("Missing required date fields");
          return;
        }

        let votingDeadlineISO: string | undefined;
        if (
          formData.votingDeadlineEnabled &&
          formData.votingDeadline &&
          formData.votingDeadlineTime
        ) {
          votingDeadlineISO = calendarDayToWallClock(
            formData.votingDeadline,
            formData.votingDeadlineTime,
          );
        }

        const payload: CreateEventRequest = {
          type: formData.eventType,
          title: formData.title,
          description: formData.description || undefined,
          startDate: !isRecurring
            ? (formData.startDate ?? undefined)
            : undefined,
          endDate: !isRecurring ? (formData.endDate ?? undefined) : undefined,
          weekdays:
            isRecurring && formData.weekdays.length > 0
              ? formData.weekdays
              : undefined,
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDurationMin: 15,
          timeZone: formData.timeZone,
          defaultGranularityMin: formData.defaultGranularityMin,
          defaultVoteMode: toVoteModeDto(formData.defaultVoteMode),
          shareVoteToChat: formData.shareVoteToChat,
          votingDeadline: votingDeadlineISO,
          lineGroupId: formData.lineGroupId || undefined,
          expectedLineUserIds:
            formData.selectedLineUserIds.length > 0
              ? formData.selectedLineUserIds
              : undefined,
        };

        const result = await apiFetchJson<CreateEventResponse>("/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        router.push(`/new/success/${result.eventId}`);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to create event",
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, refreshValidation, router, setLoading],
  );

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
      return;
    }

    const shouldCloseLiffWindow =
      typeof window !== "undefined" && isInLiff && window.history.length <= 1;
    if (shouldCloseLiffWindow) {
      void closeWindow();
      return;
    }

    router.push(DEFAULT_OVERVIEW_PATH);
  }, [closeWindow, hasUnsavedChanges, isInLiff, router, setShowCancelConfirm]);

  const confirmCancel = useCallback(async () => {
    const shouldCloseLiffWindow =
      typeof window !== "undefined" && isInLiff && window.history.length <= 1;

    setShowCancelConfirm(false);

    if (shouldCloseLiffWindow) {
      await closeWindow();
      return;
    }

    router.push(DEFAULT_OVERVIEW_PATH);
  }, [closeWindow, isInLiff, router, setShowCancelConfirm]);

  const cancelConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, [setShowCancelConfirm]);

  return {
    handleSubmit,
    handleCancel,
    confirmCancel,
    cancelConfirmCancel,
  };
}
