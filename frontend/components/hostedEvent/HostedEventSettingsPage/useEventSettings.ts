import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";

export interface EventSettingsFormData {
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
}

const initialFormData: EventSettingsFormData = {
  title: "",
  description: "",
  startDate: null,
  endDate: null,
  startTime: "00:00",
  endTime: "23:59",
  slotDurationMin: 15,
};

export function useEventSettings(eventId: string) {
  const router = useRouter();
  const { data: eventData, loading, refetch } = useHostedEventDetail(eventId);

  const [formData, setFormData] =
    useState<EventSettingsFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data from event
  useEffect(() => {
    if (eventData?.event) {
      const event = eventData.event;
      const formatMinuteToTime = (minute: number) => {
        const hours = Math.floor(minute / 60);
        const mins = minute % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      };

      setFormData({
        title: event.title || "",
        description: event.description || "",
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        startTime: formatMinuteToTime(event.startMinuteOfDay),
        endTime: formatMinuteToTime(event.endMinuteOfDay),
        slotDurationMin: event.slotDurationMin,
      });
    }
  }, [eventData]);

  const updateField = useCallback(
    <K extends keyof EventSettingsFormData>(
      field: K,
      value: EventSettingsFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            startDate: formData.startDate
              ? formatDate(formData.startDate)
              : undefined,
            endDate: formData.endDate
              ? formatDate(formData.endDate)
              : undefined,
            startTime: formData.startTime,
            endTime: formData.endTime,
            slotDurationMin: formData.slotDurationMin,
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
  }, [eventId, formData, refetch]);

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
    formData,
    updateField,
    loading,
    saving,
    saveSuccess,
    deleting,
    showDeleteConfirm,
    handleSave,
    handleDelete,
    toggleDeleteConfirm,
  };
}
