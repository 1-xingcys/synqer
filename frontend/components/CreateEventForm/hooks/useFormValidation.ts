"use client";

import { useMemo } from "react";
import { isVotingDeadlineComplete } from "@/lib/votingDeadline";
import { CreateEventFormData } from "../types";
import { todayInZone } from "@/lib/time";
import { parseTimeToMinutes } from "./utils";

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
  if (
    !isRecurring &&
    formData.startDate &&
    formData.startDate < todayInZone(formData.timeZone, now)
  ) {
    errorSet.add(ValidationError.StartDateInPast);
  }

  if (
    !isVotingDeadlineComplete({
      enabled: formData.votingDeadlineEnabled,
      date: formData.votingDeadline,
      time: formData.votingDeadlineTime,
    })
  ) {
    errorSet.add(ValidationError.DeadlineRequired);
  }

  return errorSet;
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
    current.votingDeadline === initial.votingDeadline &&
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
    formData.startDate !== initialFormData.startDate ||
    formData.endDate !== initialFormData.endDate ||
    !isSameStringArray(formData.weekdays, initialFormData.weekdays) ||
    formData.startTime !== initialFormData.startTime ||
    formData.endTime !== initialFormData.endTime ||
    formData.timeZone !== initialFormData.timeZone ||
    formData.defaultGranularityMin !== initialFormData.defaultGranularityMin ||
    formData.defaultVoteMode !== initialFormData.defaultVoteMode ||
    formData.shareVoteToChat !== initialFormData.shareVoteToChat ||
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
