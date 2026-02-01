import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useHostedEventContext } from "@/contexts/HostedEventContext";

export interface VotingDeadlineFormData {
  deadlineDate: Date | null;
  deadlineTime: string;
}

export function useEventSettings(eventId: string) {
  const router = useRouter();
  const { data: eventData, isLoading, refetch } = useHostedEventContext();

  const [formData, setFormData] = useState<VotingDeadlineFormData>({
    deadlineDate: null,
    deadlineTime: "00:00",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            votingDeadline,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void refetch();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }, [eventId, formData, isDeadlineValid, refetch]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      router.push("/hosted");
    } catch (error) {
      console.error("Failed to delete event:", error);
      setDeleting(false);
    }
  }, [eventId, router]);

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
