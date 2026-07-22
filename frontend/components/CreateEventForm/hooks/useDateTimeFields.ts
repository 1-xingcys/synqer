"use client";

import { useCallback } from "react";
import { CreateEventFormData } from "../types";
import { withSyncedVotingDeadline } from "./utils";
import type { EventType } from "@/types/event";

export function useDateTimeFields(
  setFormData: React.Dispatch<React.SetStateAction<CreateEventFormData>>,
) {
  const handleEventTypeChange = useCallback(
    (eventType: EventType) => {
      // One-time and recurring events propose different deadlines, so the
      // proposal has to be recomputed when the type flips.
      setFormData((prev) => withSyncedVotingDeadline({ ...prev, eventType }));
    },
    [setFormData],
  );

  const handleVotingDeadlineEnabledChange = useCallback(
    (enabled: boolean) => {
      // Keep the picked/proposed values while disabled — the payload ignores
      // them (see useFormActions) and re-ticking the box would otherwise drop
      // the host back onto two empty fields and a validation error.
      setFormData((prev) => ({ ...prev, votingDeadlineEnabled: enabled }));
    },
    [setFormData],
  );

  const handleStartDateChange = useCallback(
    (date: Date | null) => {
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

        return withSyncedVotingDeadline(newData);
      });
    },
    [setFormData],
  );

  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      setFormData((prev) => {
        const newData = { ...prev, endDate: date };

        if (date && prev.startDate && prev.startDate > date) {
          newData.startDate = date;
        }

        if (date && !prev.startDate) {
          newData.startDate = date;
        }

        return newData;
      });
    },
    [setFormData],
  );

  const handleStartTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) =>
        withSyncedVotingDeadline({ ...prev, startTime: value }),
      );
    },
    [setFormData],
  );

  const handleEndTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) =>
        withSyncedVotingDeadline({ ...prev, endTime: value }),
      );
    },
    [setFormData],
  );

  const handleTimeZoneChange = useCallback(
    (value: string) => {
      setFormData((prev) =>
        withSyncedVotingDeadline({ ...prev, timeZone: value }),
      );
    },
    [setFormData],
  );

  // Editing either deadline field by hand stops it from tracking the schedule.
  const handleVotingDeadlineDateChange = useCallback(
    (date: Date | null) => {
      setFormData((prev) => ({
        ...prev,
        votingDeadline: date,
        votingDeadlineTouched: true,
      }));
    },
    [setFormData],
  );

  const handleVotingDeadlineTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        votingDeadlineTime: value,
        votingDeadlineTouched: true,
      }));
    },
    [setFormData],
  );

  return {
    handleEventTypeChange,
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleTimeZoneChange,
    handleVotingDeadlineEnabledChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
  };
}
