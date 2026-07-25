"use client";

import { useMemo } from "react";
import {
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
} from "@/lib/votingDeadline";
import { CreateEventFormData } from "../types";
import { parseTimeToMinutes, getTodayInTimeZone } from "./utils";

export enum ValidationError {
  TitleRequired = "TitleRequired",
  StartTimeAfterEndTime = "StartTimeAfterEndTime",
  StartDateInPast = "StartDateInPast",
  DeadlineRequired = "DeadlineRequired",
  WeekdaysRequired = "WeekdaysRequired",
}

export function getCreateEventValidationErrors(
  formData: CreateEventFormData,
  now: Date = new Date(),
) {
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

  // Only the calendar day matters: a voting window may legitimately start
  // earlier today than "now" (e.g. creating a 09:00-18:00 window at noon),
  // so the time of day is never compared against the clock.
  if (!isRecurring && formData.startDate) {
    const todayInZone = getTodayInTimeZone(formData.timeZone, now);
    const startDay = new Date(
      formData.startDate.getFullYear(),
      formData.startDate.getMonth(),
      formData.startDate.getDate(),
    );

    if (startDay < todayInZone) {
      errorSet.add(ValidationError.StartDateInPast);
    }
  }

  const deadlineError = validateVotingDeadline({
    enabled: formData.votingDeadlineEnabled,
    date: formData.votingDeadline,
    time: formData.votingDeadlineTime,
  });

  if (deadlineError === VOTING_DEADLINE_ERROR.REQUIRED) {
    errorSet.add(ValidationError.DeadlineRequired);
  }

  return errorSet;
}

function isSameDay(first: Date | null, second: Date | null) {
  if (!first || !second) return first === second;
  return first.toDateString() === second.toDateString();
}

function isSameStringArray(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

function isSameVotingDeadlineState(
  current: CreateEventFormData,
  initial: CreateEventFormData,
) {
  if (current.votingDeadlineEnabled !== initial.votingDeadlineEnabled) {
    return false;
  }

  if (!current.votingDeadlineEnabled) {
    return true;
  }

  return (
    isSameDay(current.votingDeadline, initial.votingDeadline) &&
    current.votingDeadlineTime === initial.votingDeadlineTime
  );
}

export function hasCreateEventUnsavedChanges(
  formData: CreateEventFormData,
  initialFormData: CreateEventFormData,
) {
  return (
    formData.eventType !== initialFormData.eventType ||
    formData.title !== initialFormData.title ||
    formData.description !== initialFormData.description ||
    !isSameDay(formData.startDate, initialFormData.startDate) ||
    !isSameDay(formData.endDate, initialFormData.endDate) ||
    !isSameStringArray(formData.weekdays, initialFormData.weekdays) ||
    formData.startTime !== initialFormData.startTime ||
    formData.endTime !== initialFormData.endTime ||
    formData.timeZone !== initialFormData.timeZone ||
    formData.defaultGranularityMin !== initialFormData.defaultGranularityMin ||
    formData.defaultVoteMode !== initialFormData.defaultVoteMode ||
    !isSameVotingDeadlineState(formData, initialFormData) ||
    formData.lineGroupId !== initialFormData.lineGroupId ||
    !isSameStringArray(
      formData.selectedLineUserIds,
      initialFormData.selectedLineUserIds,
    )
  );
}

export function useFormValidation(
  formData: CreateEventFormData,
  initialFormData: CreateEventFormData,
  validationRevision = 0,
) {
  const errors = useMemo(() => {
    // Re-run validation when submit explicitly requests a fresh "now" check.
    void validationRevision;
    return getCreateEventValidationErrors(formData);
  }, [formData, validationRevision]);

  const hasUnsavedChanges = useMemo(
    () => hasCreateEventUnsavedChanges(formData, initialFormData),
    [formData, initialFormData],
  );

  return {
    errors,
    hasUnsavedChanges,
  };
}
