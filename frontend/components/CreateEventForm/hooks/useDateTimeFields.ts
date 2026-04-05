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
            votingDeadlineManuallySet: false,
          };
        }

        if (prev.eventType === "ONE_TIME" && !prev.votingDeadlineManuallySet) {
          return {
            ...prev,
            votingDeadlineEnabled: true,
            votingDeadline: prev.startDate,
            votingDeadlineTime: prev.startTime,
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

        if (prev.eventType === "ONE_TIME" && !prev.votingDeadlineManuallySet) {
          newData.votingDeadline = date;
          newData.votingDeadlineTime = prev.startTime;
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
        let nextStartDate = prev.startDate;

        if (date && prev.startDate && prev.startDate > date) {
          nextStartDate = date;
          newData.startDate = date;
        }

        if (date && !prev.startDate) {
          nextStartDate = date;
          newData.startDate = date;
        }

        if (
          prev.eventType === "ONE_TIME" &&
          !prev.votingDeadlineManuallySet &&
          nextStartDate !== prev.startDate
        ) {
          newData.votingDeadline = nextStartDate;
          newData.votingDeadlineTime = prev.startTime;
        }

        return newData;
      });
    },
    [setFormData],
  );

  const handleStartTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) => {
        const newData = { ...prev, startTime: value };

        if (prev.eventType === "ONE_TIME" && !prev.votingDeadlineManuallySet) {
          newData.votingDeadlineTime = value;
        }

        return newData;
      });
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
      setFormData((prev) => {
        return {
          ...prev,
          votingDeadline: date,
          votingDeadlineManuallySet: date !== null,
        };
      });
    },
    [setFormData],
  );

  const handleVotingDeadlineTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) => {
        return {
          ...prev,
          votingDeadlineTime: value,
          votingDeadlineManuallySet:
            prev.eventType === "ONE_TIME"
              ? true
              : prev.votingDeadlineManuallySet,
        };
      });
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
