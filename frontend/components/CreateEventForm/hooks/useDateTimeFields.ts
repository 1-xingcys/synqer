"use client";

import { useCallback } from "react";
import { CreateEventFormData } from "../types";

export function useDateTimeFields(
  setFormData: React.Dispatch<React.SetStateAction<CreateEventFormData>>,
) {
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

        // Sync voting deadline if not manually set
        if (
          prev.eventType === "ONE_TIME" &&
          !prev.votingDeadlineManuallySet &&
          date
        ) {
          newData.votingDeadline = date;
          newData.votingDeadlineTime = prev.startTime;
          newData.oneTimeVotingDeadline = date;
          newData.oneTimeVotingDeadlineTime = prev.startTime;
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

        // If start date is after end date, update it
        if (date && prev.startDate && prev.startDate > date) {
          newData.startDate = date;
          // Also sync voting deadline if not manually set
          if (
            prev.eventType === "ONE_TIME" &&
            !prev.votingDeadlineManuallySet
          ) {
            newData.votingDeadline = date;
            newData.votingDeadlineTime = prev.startTime;
            newData.oneTimeVotingDeadline = date;
            newData.oneTimeVotingDeadlineTime = prev.startTime;
          }
        }
        // If start date is null, set it to end date
        if (date && !prev.startDate) {
          newData.startDate = date;
          if (
            prev.eventType === "ONE_TIME" &&
            !prev.votingDeadlineManuallySet
          ) {
            newData.votingDeadline = date;
            newData.votingDeadlineTime = prev.startTime;
            newData.oneTimeVotingDeadline = date;
            newData.oneTimeVotingDeadlineTime = prev.startTime;
          }
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

        // Sync voting deadline time if not manually set
        if (prev.eventType === "ONE_TIME" && !prev.votingDeadlineManuallySet) {
          newData.votingDeadlineTime = value;
          newData.oneTimeVotingDeadlineTime = value;
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
        if (prev.eventType === "RECURRING") {
          return {
            ...prev,
            votingDeadline: date,
            votingDeadlineManuallySet: date !== null,
            recurringVotingDeadline: date,
            recurringVotingDeadlineManuallySet: date !== null,
          };
        }

        return {
          ...prev,
          votingDeadline: date,
          votingDeadlineManuallySet: true,
          oneTimeVotingDeadline: date,
          oneTimeVotingDeadlineManuallySet: true,
        };
      });
    },
    [setFormData],
  );

  const handleVotingDeadlineTimeChange = useCallback(
    (value: string) => {
      setFormData((prev) => {
        if (prev.eventType === "RECURRING") {
          return {
            ...prev,
            votingDeadlineTime: value,
            recurringVotingDeadlineTime: value,
          };
        }

        return {
          ...prev,
          votingDeadlineTime: value,
          votingDeadlineManuallySet: true,
          oneTimeVotingDeadlineTime: value,
          oneTimeVotingDeadlineManuallySet: true,
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
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
  };
}
