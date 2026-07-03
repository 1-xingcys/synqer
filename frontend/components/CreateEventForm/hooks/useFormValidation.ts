"use client";

import { useMemo } from "react";
import {
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
} from "@/lib/votingDeadline";
import { instantToZonedWallClock } from "@/lib/time";
import { CreateEventFormData, MIN_HOURS_BEFORE_EVENT } from "../types";
import { parseTimeToMinutes, combineDateAndTime } from "./utils";

export enum ValidationError {
  TitleRequired = "TitleRequired",
  StartTimeAfterEndTime = "StartTimeAfterEndTime",
  StartTimeTooSoon = "StartTimeTooSoon",
  DeadlineRequired = "DeadlineRequired",
  DeadlineAfterStart = "DeadlineAfterStart",
  DeadlineInPast = "DeadlineInPast",
  WeekdaysRequired = "WeekdaysRequired",
}

export function getCreateEventValidationErrors(
  formData: CreateEventFormData,
  now: Date = new Date(),
) {
  const errorSet = new Set<ValidationError>();
  const isRecurring = formData.eventType === "RECURRING";
  const currentTime = now;
  // Combined date-times (startDate/startTime, votingDeadline) are naive
  // wall-clock values (UTC fields carry the digits). Project "now" into the
  // same naive wall-clock space for the form's time zone before comparing.
  const wallNow = instantToZonedWallClock(currentTime, formData.timeZone);

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
    const minStartTime = new Date(wallNow);
    minStartTime.setUTCHours(
      minStartTime.getUTCHours() + MIN_HOURS_BEFORE_EVENT,
      minStartTime.getUTCMinutes(),
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
    minDateTime: wallNow,
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

  const hasUnsavedChanges = useMemo(() => {
    const isSameDay = (d1: Date | null, d2: Date | null) => {
      if (!d1 || !d2) return d1 === d2;
      return d1.toDateString() === d2.toDateString();
    };

    const isSameStringArray = (first: string[], second: string[]) =>
      first.length === second.length &&
      first.every((value, index) => value === second[index]);

    const isSameVotingDeadlineState = (
      current: CreateEventFormData,
      initial: CreateEventFormData,
    ) => {
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
    };

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
      !isSameVotingDeadlineState(formData, initialFormData) ||
      formData.lineGroupId !== initialFormData.lineGroupId ||
      !isSameStringArray(
        formData.selectedLineUserIds,
        initialFormData.selectedLineUserIds,
      )
    );
  }, [formData, initialFormData]);
  return {
    errors,
    hasUnsavedChanges,
  };
}
