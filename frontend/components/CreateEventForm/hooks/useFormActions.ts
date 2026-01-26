"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { CreateEventFormData } from "../types";
import { combineDateAndTime } from "./utils";

interface UseFormActionsProps {
  formData: CreateEventFormData;
  hasUnsavedChanges: boolean;
  setLoading: (loading: boolean) => void;
  setShowCancelConfirm: (show: boolean) => void;
}

export function useFormActions({
  formData,
  hasUnsavedChanges,
  setLoading,
  setShowCancelConfirm,
}: UseFormActionsProps) {
  const router = useRouter();

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

        const payload = {
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(errorData.message || "Failed to create event");
        }

        const result = (await response.json()) as { eventId: string };
        router.push(`/hosted/${result.eventId}`);
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
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, router, setShowCancelConfirm]);

  const confirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    router.back();
  }, [router, setShowCancelConfirm]);

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
