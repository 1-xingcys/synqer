"use client";

import { useMemo } from "react";
import { CreateEventFormData, MIN_HOURS_BEFORE_EVENT } from "../types";
import {
  parseTimeToMinutes,
  combineDateAndTime,
  getToday,
  getDefaultStartTime,
} from "./utils";

export interface ValidationErrors {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  votingDeadline?: string;
}

export function useFormValidation(formData: CreateEventFormData) {
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

    // Event start time validation: must be at least MIN_HOURS_BEFORE_EVENT from now
    if (formData.startDate) {
      const eventStartDateTime = combineDateAndTime(
        formData.startDate,
        formData.startTime,
      );
      const minStartTime = new Date();
      minStartTime.setHours(
        minStartTime.getHours() + MIN_HOURS_BEFORE_EVENT,
        minStartTime.getMinutes(),
        0,
        0,
      );

      if (eventStartDateTime < minStartTime) {
        errors.startDate = "startTimeTooSoon";
      }
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

  const isFormValid = useMemo(() => {
    return (
      formData.title.trim() !== "" && Object.keys(validationErrors).length === 0
    );
  }, [formData.title, validationErrors]);

  const hasUnsavedChanges = useMemo(() => {
    const today = getToday();
    const defaultStartTime = getDefaultStartTime();

    const isSameDay = (d1: Date | null, d2: Date | null) => {
      if (!d1 || !d2) return d1 === d2;
      return d1.toDateString() === d2.toDateString();
    };

    return (
      formData.title.trim() !== "" ||
      formData.description.trim() !== "" ||
      !isSameDay(formData.startDate, today) ||
      !isSameDay(formData.endDate, today) ||
      formData.startTime !== defaultStartTime ||
      formData.endTime !== "24:00" ||
      formData.votingDeadlineManuallySet ||
      formData.lineGroupId !== null ||
      formData.selectedLineUserIds.length > 0
    );
  }, [formData]);

  return {
    validationErrors,
    isFormValid,
    hasUnsavedChanges,
  };
}
