"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { CreateEventFormData, initialFormData } from "./types";

interface UseCreateEventFormReturn {
  formData: CreateEventFormData;
  loading: boolean;
  endDateManuallySet: boolean;
  updateField: <K extends keyof CreateEventFormData>(
    field: K,
    value: CreateEventFormData[K],
  ) => void;
  handleStartDateChange: (date: Date | null) => void;
  handleEndDateChange: (date: Date | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  isFormValid: boolean;
}

export function useCreateEventForm(): UseCreateEventFormReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] =
    useState<CreateEventFormData>(initialFormData);
  const [endDateManuallySet, setEndDateManuallySet] = useState(false);

  // Update a single field
  const updateField = useCallback(
    <K extends keyof CreateEventFormData>(
      field: K,
      value: CreateEventFormData[K],
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Handle start date change with auto-fill logic
  const handleStartDateChange = useCallback(
    (date: Date | null) => {
      setFormData((prev) => {
        const newData = { ...prev, startDate: date };
        // Auto-fill end date if it's the first time setting start date
        if (date && !endDateManuallySet && !prev.endDate) {
          newData.endDate = date;
        }
        return newData;
      });
    },
    [endDateManuallySet],
  );

  // Handle end date change
  const handleEndDateChange = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, endDate: date }));
    setEndDateManuallySet(true);
  }, []);

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        if (!formData.startDate || !formData.endDate) {
          alert("請選擇開始和結束日期");
          setLoading(false);
          return;
        }

        if (!process.env.NEXT_PUBLIC_API) {
          throw new Error("NEXT_PUBLIC_API is not set");
        }

        const payload = {
          title: formData.title,
          description: formData.description || undefined,
          startDate: formatDate(formData.startDate),
          endDate: formatDate(formData.endDate),
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDurationMin: formData.slotDurationMin,
          timeZone: formData.timeZone,
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }

        const result = (await response.json()) as { eventId: string };
        router.push(`/hosted/${result.eventId}`);
      } catch (error) {
        console.error("建立活動失敗:", error);
        alert("建立活動失敗，請重試");
      } finally {
        setLoading(false);
      }
    },
    [formData, router],
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Check if form is valid
  const isFormValid = Boolean(
    formData.title && formData.startDate && formData.endDate,
  );

  return {
    formData,
    loading,
    endDateManuallySet,
    updateField,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
    handleCancel,
    isFormValid,
  };
}
