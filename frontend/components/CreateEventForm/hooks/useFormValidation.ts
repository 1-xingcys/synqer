"use client";

import { useMemo } from "react";
import {
  CreateEventFormData,
  MIN_HOURS_BEFORE_EVENT,
  DEFAULT_WEEKDAYS,
} from "../types";
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
  DeadlineInPast = "DeadlineInPast",
  WeekdaysRequired = "WeekdaysRequired",
}

export function useFormValidation(formData: CreateEventFormData) {
  const errors = useMemo(() => {
    const errorSet = new Set<ValidationError>();
    const isRecurring = formData.eventType === "RECURRING";

    if (!formData.title.trim()) {
      errorSet.add(ValidationError.TitleRequired);
    }

    if (isRecurring && formData.weekdays.length === 0) {
      errorSet.add(ValidationError.WeekdaysRequired);
    }

    const startMinutes = parseTimeToMinutes(formData.startTime);
    const endMinutes = parseTimeToMinutes(formData.endTime);
    if (startMinutes >= endMinutes) {
      errorSet.add(ValidationError.StartTimeAfterEndTime);
    }

    if (!isRecurring && formData.startDate) {
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

    if (formData.votingDeadline) {
      const deadlineDateTime = combineDateAndTime(
        formData.votingDeadline,
        formData.votingDeadlineTime,
      );

      if (deadlineDateTime < new Date()) {
        errorSet.add(ValidationError.DeadlineInPast);
      }

      if (!isRecurring && formData.startDate) {
        const startDateTime = combineDateAndTime(
          formData.startDate,
          formData.startTime,
        );

        if (deadlineDateTime > startDateTime) {
          errorSet.add(ValidationError.DeadlineAfterStart);
        }
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
      formData.weekdays.length !== DEFAULT_WEEKDAYS.length ||
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
