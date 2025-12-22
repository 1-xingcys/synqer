"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import {
  CreateEventFormData,
  initialFormData,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  countCharacters,
  truncateToMaxChars,
  parseTimeToMinutes,
  combineDateAndTime,
  getToday,
} from "./types";

interface ValidationErrors {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  votingDeadline?: string;
}

interface UseCreateEventFormReturn {
  formData: CreateEventFormData;
  loading: boolean;
  validationErrors: ValidationErrors;
  // Field updates
  updateTitle: (value: string) => void;
  updateDescription: (value: string) => void;
  handleStartDateChange: (date: Date | null) => void;
  handleEndDateChange: (date: Date | null) => void;
  handleStartTimeChange: (value: string) => void;
  handleEndTimeChange: (value: string) => void;
  handleVotingDeadlineDateChange: (date: Date | null) => void;
  handleVotingDeadlineTimeChange: (value: string) => void;
  // LINE group
  handleLineGroupChange: (groupId: string | null) => void;
  handleSelectedMembersChange: (lineUserIds: string[]) => void;
  // Form actions
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  confirmCancel: () => void;
  cancelConfirmCancel: () => void;
  // Computed
  isFormValid: boolean;
  titleCharCount: number;
  descriptionCharCount: number;
  hasUnsavedChanges: boolean;
  showCancelConfirm: boolean;
}

export function useCreateEventForm(): UseCreateEventFormReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] =
    useState<CreateEventFormData>(initialFormData);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ===== Character counts =====
  const titleCharCount = useMemo(
    () => countCharacters(formData.title),
    [formData.title],
  );
  const descriptionCharCount = useMemo(
    () => countCharacters(formData.description),
    [formData.description],
  );

  // ===== Title update with character limit =====
  const updateTitle = useCallback((value: string) => {
    const charCount = countCharacters(value);
    if (charCount <= TITLE_MAX_LENGTH) {
      setFormData((prev) => ({ ...prev, title: value }));
    } else {
      // Truncate to max chars
      const truncated = truncateToMaxChars(value, TITLE_MAX_LENGTH);
      setFormData((prev) => ({ ...prev, title: truncated }));
    }
  }, []);

  // ===== Description update with character limit =====
  const updateDescription = useCallback((value: string) => {
    const charCount = countCharacters(value);
    if (charCount <= DESCRIPTION_MAX_LENGTH) {
      setFormData((prev) => ({ ...prev, description: value }));
    } else {
      // Truncate to max chars
      const truncated = truncateToMaxChars(value, DESCRIPTION_MAX_LENGTH);
      setFormData((prev) => ({ ...prev, description: truncated }));
    }
  }, []);

  // ===== Handle start date change =====
  const handleStartDateChange = useCallback((date: Date | null) => {
    setFormData((prev) => {
      const newData = { ...prev, startDate: date };

      // If end date is before start date, update it
      if (date && prev.endDate && prev.endDate < date) {
        newData.endDate = date;
      }
      // If end date is null, set it to start date
      if (date && !prev.endDate) {
        newData.endDate = date;
      }

      // Sync voting deadline if not manually set
      if (!prev.votingDeadlineManuallySet && date) {
        newData.votingDeadline = date;
        newData.votingDeadlineTime = prev.startTime;
      }

      return newData;
    });
  }, []);

  // ===== Handle end date change =====
  const handleEndDateChange = useCallback((date: Date | null) => {
    setFormData((prev) => {
      const newData = { ...prev, endDate: date };

      // If start date is after end date, update it
      if (date && prev.startDate && prev.startDate > date) {
        newData.startDate = date;
        // Also sync voting deadline if not manually set
        if (!prev.votingDeadlineManuallySet) {
          newData.votingDeadline = date;
          newData.votingDeadlineTime = prev.startTime;
        }
      }
      // If start date is null, set it to end date
      if (date && !prev.startDate) {
        newData.startDate = date;
        if (!prev.votingDeadlineManuallySet) {
          newData.votingDeadline = date;
          newData.votingDeadlineTime = prev.startTime;
        }
      }

      return newData;
    });
  }, []);

  // ===== Handle start time change =====
  const handleStartTimeChange = useCallback((value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, startTime: value };

      // Sync voting deadline time if not manually set
      if (!prev.votingDeadlineManuallySet) {
        newData.votingDeadlineTime = value;
      }

      return newData;
    });
  }, []);

  // ===== Handle end time change =====
  const handleEndTimeChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      endTime: value,
    }));
  }, []);

  // ===== Handle voting deadline date change =====
  const handleVotingDeadlineDateChange = useCallback((date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      votingDeadline: date,
      votingDeadlineManuallySet: true,
    }));
  }, []);

  // ===== Handle voting deadline time change =====
  const handleVotingDeadlineTimeChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      votingDeadlineTime: value,
      votingDeadlineManuallySet: true,
    }));
  }, []);

  // ===== Handle LINE group change =====
  const handleLineGroupChange = useCallback((groupId: string | null) => {
    setFormData((prev) => ({
      ...prev,
      lineGroupId: groupId,
      selectedLineUserIds: [], // Reset selection when group changes
    }));
  }, []);

  // ===== Handle selected members change =====
  const handleSelectedMembersChange = useCallback((lineUserIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      selectedLineUserIds: lineUserIds,
    }));
  }, []);

  // ===== Validation =====
  const validationErrors = useMemo((): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Title is required
    if (!formData.title.trim()) {
      errors.title = "required";
    }

    // Time validation: startTime must be < endTime
    const startMinutes = parseTimeToMinutes(formData.startTime);
    const endMinutes = parseTimeToMinutes(formData.endTime);
    if (startMinutes >= endMinutes) {
      errors.startTime = "startTimeNotBeforeEndTime";
      errors.endTime = "startTimeNotBeforeEndTime";
    }

    // Voting deadline validation
    if (
      formData.startDate &&
      formData.votingDeadline &&
      formData.votingDeadlineManuallySet
    ) {
      const startDateTime = combineDateAndTime(
        formData.startDate,
        formData.startTime,
      );
      const deadlineDateTime = combineDateAndTime(
        formData.votingDeadline,
        formData.votingDeadlineTime,
      );

      if (deadlineDateTime > startDateTime) {
        errors.votingDeadline = "deadlineAfterStart";
      }
    }

    return errors;
  }, [formData]);

  // ===== Form validation =====
  // Start/End date are no longer required
  const isFormValid = useMemo(() => {
    return (
      formData.title.trim() !== "" && Object.keys(validationErrors).length === 0
    );
  }, [formData.title, validationErrors]);

  // ===== Format date to YYYY-MM-DD =====
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ===== Handle form submission =====
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

        // Build voting deadline ISO string if set
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
          slotDurationMin: 15, // Fixed at 15 minutes
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
          headers: {
            "Content-Type": "application/json",
          },
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
        console.error("建立活動失敗:", error);
        alert("建立活動失敗，請重試");
      } finally {
        setLoading(false);
      }
    },
    [formData, router],
  );

  // ===== Check if form has unsaved changes =====
  const hasUnsavedChanges = useMemo(() => {
    const today = getToday();
    const isSameDay = (d1: Date | null, d2: Date | null) => {
      if (!d1 || !d2) return d1 === d2;
      return d1.toDateString() === d2.toDateString();
    };

    // Check if any field differs from initial values
    return (
      formData.title.trim() !== "" ||
      formData.description.trim() !== "" ||
      !isSameDay(formData.startDate, today) ||
      !isSameDay(formData.endDate, today) ||
      formData.startTime !== "00:00" ||
      formData.endTime !== "24:00" ||
      formData.votingDeadlineManuallySet ||
      formData.lineGroupId !== null ||
      formData.selectedLineUserIds.length > 0
    );
  }, [formData]);

  // ===== Handle cancel =====
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      router.back();
    }
  }, [hasUnsavedChanges, router]);

  // ===== Confirm cancel =====
  const confirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    router.back();
  }, [router]);

  // ===== Cancel the confirm dialog =====
  const cancelConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  return {
    formData,
    loading,
    validationErrors,
    updateTitle,
    updateDescription,
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
    handleLineGroupChange,
    handleSelectedMembersChange,
    handleSubmit,
    handleCancel,
    confirmCancel,
    cancelConfirmCancel,
    isFormValid,
    titleCharCount,
    descriptionCharCount,
    hasUnsavedChanges,
    showCancelConfirm,
  };
}
