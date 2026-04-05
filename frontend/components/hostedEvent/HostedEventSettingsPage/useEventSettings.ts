import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import {
  combineVotingDeadline,
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
  type VotingDeadlineError,
} from "@/lib/votingDeadline";
import { apiFetchJson } from "@/lib/apiClient";
import { hostedEventsKeys } from "@/hooks/useHostedEvents";
import type { operations } from "@/generated/openapi";

export interface VotingDeadlineFormData {
  deadlineEnabled: boolean;
  deadlineDate: Date | null;
  deadlineTime: string;
}

type UpdateEventRequest =
  operations["EventCoreController_update"]["requestBody"]["content"]["application/json"];
type UpdateEventResponse =
  operations["EventCoreController_update"]["responses"][200]["content"]["application/json"];
type RemoveEventResponse =
  operations["EventCoreController_remove"]["responses"][200]["content"]["application/json"];

export function useEventSettings(eventId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: eventData, isLoading, refetch } = useHostedEventContext();

  const [formData, setFormData] = useState<VotingDeadlineFormData>({
    deadlineEnabled: false,
    deadlineDate: null,
    deadlineTime: "00:00",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateVotingDeadline = useCallback(
    async (votingDeadline?: string | null) => {
      const payload: UpdateEventRequest = { votingDeadline };

      await apiFetchJson<UpdateEventResponse>(`/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
    [eventId],
  );

  const deleteEvent = useCallback(async () => {
    await apiFetchJson<RemoveEventResponse>(`/events/${eventId}`, {
      method: "DELETE",
    });
  }, [eventId]);

  // 計算活動最早的時段日期和時間（作為 deadline 的上限）
  const earliestSlot = useMemo(() => {
    if (!eventData?.slots || eventData.slots.length === 0) {
      return null;
    }

    const dateSlots = eventData.slots.filter(
      (slot) => slot.axisType === "DATE" && slot.axisDate,
    );

    if (dateSlots.length === 0) {
      return null;
    }

    // 找到最早的日期型時段
    const sorted = [...dateSlots].sort((a, b) => {
      const dateA = new Date(a.axisDate!).getTime();
      const dateB = new Date(b.axisDate!).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startMinute - b.startMinute;
    });

    const earliest = sorted[0];
    const date = new Date(earliest.axisDate!);
    const hours = Math.floor(earliest.startMinute / 60);
    const mins = earliest.startMinute % 60;
    const time = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

    return { date, time };
  }, [eventData?.slots]);

  // Initialize form data from event
  useEffect(() => {
    if (eventData?.event) {
      const event = eventData.event;

      if (event.votingDeadline) {
        const deadline = new Date(event.votingDeadline);
        const hours = deadline.getHours();
        const mins = deadline.getMinutes();
        const time = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

        setFormData({
          deadlineEnabled: true,
          deadlineDate: deadline,
          deadlineTime: time,
        });
      } else {
        setFormData({
          deadlineEnabled: false,
          deadlineDate: earliestSlot?.date ?? null,
          deadlineTime: earliestSlot?.time ?? "00:00",
        });
      }
    }
  }, [eventData, earliestSlot]);

  const updateDeadlineEnabled = useCallback(
    (enabled: boolean) => {
      setFormData((prev) => {
        if (!enabled) {
          return {
            ...prev,
            deadlineEnabled: false,
            deadlineDate: null,
          };
        }

        return {
          ...prev,
          deadlineEnabled: true,
          deadlineDate: prev.deadlineDate ?? earliestSlot?.date ?? null,
          deadlineTime: prev.deadlineTime || earliestSlot?.time || "00:00",
        };
      });
    },
    [earliestSlot],
  );

  const updateDeadlineDate = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, deadlineDate: date }));
  }, []);

  const updateDeadlineTime = useCallback((time: string) => {
    setFormData((prev) => ({ ...prev, deadlineTime: time }));
  }, []);

  // Reuse the same validation engine as the create page, but with
  // hosted-settings-specific bounds: now ~ earliest available slot.
  const deadlineError = useMemo<VotingDeadlineError | null>(() => {
    return validateVotingDeadline({
      enabled: formData.deadlineEnabled,
      date: formData.deadlineDate,
      time: formData.deadlineTime,
      minDateTime: new Date(),
      maxDateTime: earliestSlot
        ? combineVotingDeadline(earliestSlot.date, earliestSlot.time)
        : null,
    });
  }, [earliestSlot, formData]);

  const isDeadlineValid = deadlineError === null;
  const hasDeadlineRequiredError =
    deadlineError === VOTING_DEADLINE_ERROR.REQUIRED;

  const handleSave = useCallback(async () => {
    if (deadlineError !== null) return;

    try {
      setSaving(true);
      setSaveError(null);

      // 組合日期和時間
      let votingDeadline: string | null | undefined;
      if (!formData.deadlineEnabled) {
        votingDeadline = null;
      } else if (formData.deadlineDate) {
        votingDeadline = combineVotingDeadline(
          formData.deadlineDate,
          formData.deadlineTime,
        ).toISOString();
      }

      await updateVotingDeadline(votingDeadline);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void refetch();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  }, [deadlineError, formData, refetch, updateVotingDeadline]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await deleteEvent();
      await queryClient.invalidateQueries({ queryKey: hostedEventsKeys.all });

      router.push("/hosted");
    } catch (error) {
      console.error("Failed to delete event:", error);
      setDeleting(false);
    }
  }, [deleteEvent, queryClient, router]);

  const toggleDeleteConfirm = useCallback((show: boolean) => {
    setShowDeleteConfirm(show);
  }, []);

  return {
    eventData,
    formData,
    earliestSlot,
    deadlineError,
    isDeadlineValid,
    hasDeadlineRequiredError,
    updateDeadlineEnabled,
    updateDeadlineDate,
    updateDeadlineTime,
    isLoading,
    saving,
    saveSuccess,
    saveError,
    deleting,
    showDeleteConfirm,
    handleSave,
    handleDelete,
    toggleDeleteConfirm,
  };
}
