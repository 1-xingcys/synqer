"use client";

import { useCallback } from "react";
import { CreateEventFormData } from "../types";

export function useDateTimeFields(
  setFormData: React.Dispatch<React.SetStateAction<CreateEventFormData>>,
) {
  const handleVotingDeadlineEnabledChange = useCallback(
    (enabled: boolean) => {
      setFormData((prev) => {
        if (!enabled) {
          return {
            ...prev,
            votingDeadlineEnabled: false,
            votingDeadline: null,
            votingDeadlineTime: null,
          };
        }

        return {
          ...prev,
          votingDeadlineEnabled: true,
        };
      });
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

        return newData;
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
      setFormData((prev) => ({
        ...prev,
        startTime: value,
      }));
    },
    [setFormData],
  );

  const handleEndTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        endTime: value,
      }));
    },
    [setFormData],
  );

  const handleVotingDeadlineDateChange = useCallback(
    (date: Date | null) => {
      setFormData((prev) => ({
        ...prev,
        votingDeadline: date,
      }));
    },
    [setFormData],
  );

  const handleVotingDeadlineTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        votingDeadlineTime: value,
      }));
    },
    [setFormData],
  );

  return {
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleVotingDeadlineEnabledChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
  };
}
