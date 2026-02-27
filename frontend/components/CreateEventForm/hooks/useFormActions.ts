"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useLiff } from "@/hooks/useLiff";
import { apiFetchJson } from "@/lib/apiClient";
import type { operations } from "@/generated/openapi";
import { CreateEventFormData } from "../types";
import { combineDateAndTime } from "./utils";

interface UseFormActionsProps {
  formData: CreateEventFormData;
  hasUnsavedChanges: boolean;
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
  setLoading,
  setShowCancelConfirm,
}: UseFormActionsProps) {
  const router = useRouter();
  const { isInClient: isInLiff, closeWindow } = useLiff();

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Defensive null check for required fields
        if (!formData.startDate || !formData.endDate) {
          console.error("Missing required date fields");
          return;
        }

        let votingDeadlineISO: string | undefined;
        if (formData.votingDeadline) {
          const deadlineDateTime = combineDateAndTime(
            formData.votingDeadline,
            formData.votingDeadlineTime,
          );
          votingDeadlineISO = deadlineDateTime.toISOString();
        }

        const payload: CreateEventRequest = {
          title: formData.title,
          description: formData.description || undefined,
          startDate: formatDate(formData.startDate),
          endDate: formatDate(formData.endDate),
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDurationMin: 15,
          timeZone: formData.timeZone,
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
    [formData, router, setLoading],
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

    router.push("/joined");
  }, [closeWindow, hasUnsavedChanges, isInLiff, router, setShowCancelConfirm]);

  const confirmCancel = useCallback(async () => {
    const shouldCloseLiffWindow =
      typeof window !== "undefined" && isInLiff && window.history.length <= 1;

    setShowCancelConfirm(false);

    if (shouldCloseLiffWindow) {
      await closeWindow();
      return;
    }

    router.push("/joined");
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
