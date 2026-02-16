import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import { apiFetchJson } from "@/lib/apiClient";
import { hostedEventsKeys } from "@/hooks/useHostedEvents";
import type { operations } from "@/generated/openapi";

export interface VotingDeadlineFormData {
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
    deadlineDate: null,
    deadlineTime: "00:00",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateVotingDeadline = useCallback(
    async (votingDeadline?: string) => {
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

    // 找到最早的時段
    const sorted = [...eventData.slots].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startMinute - b.startMinute;
    });

    const earliest = sorted[0];
    const date = new Date(earliest.date);
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
          deadlineDate: deadline,
          deadlineTime: time,
        });
      } else if (earliestSlot) {
        // 如果沒有設定 deadline，使用最早時段作為預設
        setFormData({
          deadlineDate: earliestSlot.date,
          deadlineTime: earliestSlot.time,
        });
      }
    }
  }, [eventData, earliestSlot]);

  const updateDeadlineDate = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, deadlineDate: date }));
  }, []);

  const updateDeadlineTime = useCallback((time: string) => {
    setFormData((prev) => ({ ...prev, deadlineTime: time }));
  }, []);

  // 檢查 deadline 是否有效（不晚於最早時段）
  const isDeadlineValid = useMemo(() => {
    if (!formData.deadlineDate || !earliestSlot) return true;

    const deadlineDateTime = new Date(formData.deadlineDate);
    const [hours, mins] = formData.deadlineTime.split(":").map(Number);
    deadlineDateTime.setHours(hours, mins, 0, 0);

    const earliestDateTime = new Date(earliestSlot.date);
    const [eHours, eMins] = earliestSlot.time.split(":").map(Number);
    earliestDateTime.setHours(eHours, eMins, 0, 0);

    return deadlineDateTime <= earliestDateTime;
  }, [formData, earliestSlot]);

  const handleSave = useCallback(async () => {
    if (!isDeadlineValid) return;

    try {
      setSaving(true);

      // 組合日期和時間
      let votingDeadline: string | undefined;
      if (formData.deadlineDate) {
        const deadline = new Date(formData.deadlineDate);
        const [hours, mins] = formData.deadlineTime.split(":").map(Number);
        deadline.setHours(hours, mins, 0, 0);
        votingDeadline = deadline.toISOString();
      }

      await updateVotingDeadline(votingDeadline);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void refetch();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }, [formData, isDeadlineValid, refetch, updateVotingDeadline]);

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
    isDeadlineValid,
    updateDeadlineDate,
    updateDeadlineTime,
    isLoading,
    saving,
    saveSuccess,
    deleting,
    showDeleteConfirm,
    handleSave,
    handleDelete,
    toggleDeleteConfirm,
  };
}
