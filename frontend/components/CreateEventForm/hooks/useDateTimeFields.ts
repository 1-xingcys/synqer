"use client";

import { useCallback } from "react";
import type { CalendarDay } from "@/lib/time";
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
    (day: CalendarDay | null) => {
      setFormData((prev) => {
        const newData = { ...prev, startDate: day };

        // If end date is before start date, update it
        if (day && prev.endDate && prev.endDate < day) {
          newData.endDate = day;
        }
        // If end date is null, set it to start date
        if (day && !prev.endDate) {
          newData.endDate = day;
        }

        return withSyncedVotingDeadline(newData);
      });
    },
    [setFormData],
  );

  const handleEndDateChange = useCallback(
    (day: CalendarDay | null) => {
      setFormData((prev) => {
        const newData = { ...prev, endDate: day };

        if (day && prev.startDate && prev.startDate > day) {
          newData.startDate = day;
        }

        if (day && !prev.startDate) {
          newData.startDate = day;
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
    (day: CalendarDay | null) => {
      setFormData((prev) => ({
        ...prev,
        votingDeadline: day,
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
