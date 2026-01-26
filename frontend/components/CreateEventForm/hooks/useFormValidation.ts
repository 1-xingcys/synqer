"use client";

import { useMemo } from "react";
import { CreateEventFormData, MIN_HOURS_BEFORE_EVENT } from "../types";
import {
  parseTimeToMinutes,
  combineDateAndTime,
  getDefaultStartDateTime,
} from "./utils";

export enum ValidationError {
  TitleRequired = "TitleRequired",
  StartTimeAfterEndTime = "StartTimeAfterEndTime",
  StartTimeTooSoon = "StartTimeTooSoon",
  DeadlineAfterStart = "DeadlineAfterStart",
}

export function useFormValidation(formData: CreateEventFormData) {
  const errors = useMemo(() => {
    const errorSet = new Set<ValidationError>();

    if (!formData.title.trim()) {
      errorSet.add(ValidationError.TitleRequired);
    }

    const startMinutes = parseTimeToMinutes(formData.startTime);
    const endMinutes = parseTimeToMinutes(formData.endTime);
    if (startMinutes >= endMinutes) {
      errorSet.add(ValidationError.StartTimeAfterEndTime);
    }

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
        errorSet.add(ValidationError.StartTimeTooSoon);
      }
    }

    if (formData.startDate && formData.votingDeadline) {
      const startDateTime = combineDateAndTime(
        formData.startDate,
        formData.startTime,
      );
      const deadlineDateTime = combineDateAndTime(
        formData.votingDeadline,
        formData.votingDeadlineTime,
      );

      if (deadlineDateTime > startDateTime) {
        errorSet.add(ValidationError.DeadlineAfterStart);
      }
    }

    return errorSet;
  }, [formData]);

  const hasUnsavedChanges = useMemo(() => {
    const { date: defaultDate, time: defaultTime } = getDefaultStartDateTime();

    const isSameDay = (d1: Date | null, d2: Date | null) => {
      if (!d1 || !d2) return d1 === d2;
      return d1.toDateString() === d2.toDateString();
    };

    return (
      formData.title.trim() !== "" ||
      formData.description.trim() !== "" ||
      !isSameDay(formData.startDate, defaultDate) ||
      !isSameDay(formData.endDate, defaultDate) ||
      formData.startTime !== defaultTime ||
      formData.endTime !== "24:00" ||
      formData.votingDeadlineManuallySet ||
      formData.lineGroupId !== null ||
      formData.selectedLineUserIds.length > 0
    );
  }, [formData]);

  return {
    errors,
    hasUnsavedChanges,
  };
}
