"use client";

import { useMemo } from "react";
import { useMinuteNow } from "@/hooks/useMinuteNow";
import {
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
} from "@/lib/votingDeadline";
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
  DeadlineRequired = "DeadlineRequired",
  DeadlineAfterStart = "DeadlineAfterStart",
  DeadlineInPast = "DeadlineInPast",
  WeekdaysRequired = "WeekdaysRequired",
}

export function useFormValidation(formData: CreateEventFormData) {
  const now = useMinuteNow();

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
      const minStartTime = new Date(now);
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

    const deadlineError = validateVotingDeadline({
      enabled: formData.votingDeadlineEnabled,
      date: formData.votingDeadline,
      time: formData.votingDeadlineTime,
      minDateTime: now,
      maxDateTime:
        !isRecurring && formData.startDate
          ? combineDateAndTime(formData.startDate, formData.startTime)
          : null,
    });

    if (deadlineError === VOTING_DEADLINE_ERROR.REQUIRED) {
      errorSet.add(ValidationError.DeadlineRequired);
    }

    if (deadlineError === VOTING_DEADLINE_ERROR.IN_PAST) {
      errorSet.add(ValidationError.DeadlineInPast);
    }

    if (deadlineError === VOTING_DEADLINE_ERROR.AFTER_MAX) {
      errorSet.add(ValidationError.DeadlineAfterStart);
    }

    return errorSet;
  }, [formData, now]);

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
      formData.votingDeadlineEnabled ||
      formData.lineGroupId !== null ||
      formData.selectedLineUserIds.length > 0
    );
  }, [formData]);
  return {
    errors,
    hasUnsavedChanges,
  };
}
