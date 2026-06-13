import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import {
  combineVotingDeadline,
  validateVotingDeadline,
  VOTING_DEADLINE_ERROR,
  type VotingDeadlineError,
} from "@/lib/votingDeadline";
import { apiFetchJson } from "@/lib/apiClient";
import { hostedEventsKeys } from "@/hooks/useHostedEvents";
import { getOneTimeEventStartInstant } from "@/lib/eventSchedule";
import { formatMinutesToTime } from "@/lib/utils";
import type { operations } from "@/generated/openapi";
import { EventStatus, type EventSchedule } from "@/types/event";

export interface VotingDeadlineFormData {
  deadlineEnabled: boolean;
  deadlineDate: Date | null;
  deadlineTime: string | null;
}

const EMPTY_FORM_DATA: VotingDeadlineFormData = {
  deadlineEnabled: false,
  deadlineDate: null,
  deadlineTime: null,
};

function normalizeDateOnly(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function cloneVotingDeadlineFormData(
  formData: VotingDeadlineFormData,
): VotingDeadlineFormData {
  return {
    ...formData,
    deadlineDate: formData.deadlineDate
      ? new Date(formData.deadlineDate)
      : null,
  };
}

function areSameCalendarDay(left: Date | null, right: Date | null): boolean {
  if (!left || !right) return left === right;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function areVotingDeadlineFormsEqual(
  left: VotingDeadlineFormData,
  right: VotingDeadlineFormData,
): boolean {
  if (left.deadlineEnabled !== right.deadlineEnabled) {
    return false;
  }

  if (!left.deadlineEnabled) {
    return true;
  }

  return (
    left.deadlineTime === right.deadlineTime &&
    areSameCalendarDay(left.deadlineDate, right.deadlineDate)
  );
}

function buildVotingDeadlineFormData(
  votingDeadline?: string | null,
): VotingDeadlineFormData {
  if (votingDeadline) {
    const deadline = new Date(votingDeadline);
    const time = formatMinutesToTime(
      deadline.getHours() * 60 + deadline.getMinutes(),
    );

    return {
      deadlineEnabled: true,
      deadlineDate: normalizeDateOnly(deadline),
      deadlineTime: time,
    };
  }

  return { ...EMPTY_FORM_DATA };
}

type UpdateEventRequest =
  operations["EventCoreController_update"]["requestBody"]["content"]["application/json"];
type UpdateEventResponse =
  operations["EventCoreController_update"]["responses"][200]["content"]["application/json"];
type RemoveEventResponse =
  operations["EventCoreController_remove"]["responses"][200]["content"]["application/json"];

type DeadlineLockableEvent = {
  status: EventStatus;
  schedule: EventSchedule;
};

type EarliestSlot = {
  date: Date;
  time: string;
};

function isVotingDeadlineLocked(
  event: DeadlineLockableEvent | null | undefined,
  now: Date = new Date(),
) {
  if (!event) {
    return false;
  }

  if (
    event.status === EventStatus.CONFIRMED ||
    event.status === EventStatus.COMPLETED
  ) {
    return true;
  }

  if (event.schedule.kind !== "ONE_TIME") {
    return false;
  }

  const eventStart = getOneTimeEventStartInstant(event.schedule);

  return now >= eventStart;
}

function getHostedDeadlineError(
  formData: VotingDeadlineFormData,
  earliestSlot: EarliestSlot | null,
  now: Date = new Date(),
): VotingDeadlineError | null {
  return validateVotingDeadline({
    enabled: formData.deadlineEnabled,
    date: formData.deadlineDate,
    time: formData.deadlineTime,
    minDateTime: now,
    maxDateTime: earliestSlot
      ? combineVotingDeadline(earliestSlot.date, earliestSlot.time)
      : null,
  });
}

export function useEventSettings(eventId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: eventData, isLoading, refetch } = useHostedEventContext();

  const [formData, setFormData] =
    useState<VotingDeadlineFormData>(EMPTY_FORM_DATA);
  const [savedFormData, setSavedFormData] =
    useState<VotingDeadlineFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Force a fresh "now" validation after the user clicks save, without
  // keeping a timer running while the form sits idle.
  const [validationRevision, setValidationRevision] = useState(0);

  const updateVotingDeadline = useCallback(
    async (votingDeadline?: string | null) => {
      const payload: UpdateEventRequest = { votingDeadline };

      await apiFetchJson<UpdateEventResponse>(`/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
    [eventId],
  );

  const deleteEvent = useCallback(async () => {
    await apiFetchJson<RemoveEventResponse>(`/events/${eventId}`, {
      method: "DELETE",
    });
  }, [eventId]);

  // 計算活動最早的時段日期和時間（作為 deadline 的上限）
  const earliestSlot = useMemo(() => {
    if (!eventData?.slots || eventData.slots.length === 0) {
      return null;
    }

    const dateSlots = eventData.slots.filter(
      (slot) => slot.axisType === "DATE" && slot.axisDate,
    );

    if (dateSlots.length === 0) {
      return null;
    }

    // 找到最早的日期型時段
    const sorted = [...dateSlots].sort((a, b) => {
      const dateA = new Date(a.axisDate!).getTime();
      const dateB = new Date(b.axisDate!).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startMinute - b.startMinute;
    });

    const earliest = sorted[0];
    const date = new Date(earliest.axisDate!);
    const time = formatMinutesToTime(earliest.startMinute);

    return { date, time };
  }, [eventData?.slots]);

  // Initialize local form data from server, but do not overwrite unsaved edits.
  useEffect(() => {
    if (eventData?.event) {
      const nextSavedFormData = buildVotingDeadlineFormData(
        eventData.event.votingDeadline,
      );
      setFormData((prev) => {
        const hasUnsavedChanges =
          savedFormData !== null &&
          !areVotingDeadlineFormsEqual(prev, savedFormData);

        const isAlreadySynced = areVotingDeadlineFormsEqual(
          prev,
          nextSavedFormData,
        );

        return hasUnsavedChanges || isAlreadySynced
          ? prev
          : cloneVotingDeadlineFormData(nextSavedFormData);
      });

      if (
        savedFormData === null ||
        !areVotingDeadlineFormsEqual(savedFormData, nextSavedFormData)
      ) {
        setSavedFormData(cloneVotingDeadlineFormData(nextSavedFormData));
      }
    }
  }, [eventData, savedFormData]);

  const updateDeadlineEnabled = useCallback((enabled: boolean) => {
    setFormData((prev) => {
      if (enabled) {
        return {
          ...prev,
          deadlineEnabled: true,
        };
      }

      return {
        ...prev,
        deadlineEnabled: false,
        deadlineDate: null,
        deadlineTime: null,
      };
    });
  }, []);

  const updateDeadlineDate = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, deadlineDate: date }));
  }, []);

  const updateDeadlineTime = useCallback((time: string) => {
    setFormData((prev) => ({ ...prev, deadlineTime: time }));
  }, []);

  const isDirty = useMemo(() => {
    if (!savedFormData) return false;
    return !areVotingDeadlineFormsEqual(formData, savedFormData);
  }, [formData, savedFormData]);

  const isDeadlineLocked = useMemo(() => {
    void validationRevision;
    return isVotingDeadlineLocked(eventData?.event);
  }, [eventData?.event, validationRevision]);

  // Reuse the same validation engine as the create page, but with
  // hosted-settings-specific bounds: now ~ earliest available slot.
  const deadlineError = useMemo<VotingDeadlineError | null>(() => {
    void validationRevision;
    return getHostedDeadlineError(formData, earliestSlot);
  }, [earliestSlot, formData, validationRevision]);

  const isDeadlineValid = deadlineError === null;
  const hasDeadlineRequiredError =
    deadlineError === VOTING_DEADLINE_ERROR.REQUIRED;

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    const latestNow = new Date();
    const latestIsDeadlineLocked = isVotingDeadlineLocked(
      eventData?.event,
      latestNow,
    );
    const latestDeadlineError = getHostedDeadlineError(
      formData,
      earliestSlot,
      latestNow,
    );

    if (latestIsDeadlineLocked || latestDeadlineError !== null) {
      setValidationRevision((previous) => previous + 1);
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      // 組合日期和時間
      let votingDeadline: string | null | undefined;
      if (!formData.deadlineEnabled) {
        votingDeadline = null;
      } else if (formData.deadlineDate && formData.deadlineTime) {
        votingDeadline = combineVotingDeadline(
          formData.deadlineDate,
          formData.deadlineTime,
        ).toISOString();
      }

      await updateVotingDeadline(votingDeadline);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await refetch();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  }, [
    earliestSlot,
    eventData?.event,
    formData,
    isDirty,
    refetch,
    updateVotingDeadline,
  ]);

  const resetForm = useCallback(() => {
    if (!savedFormData) return;

    setSaveError(null);
    setSaveSuccess(false);
    setFormData(cloneVotingDeadlineFormData(savedFormData));
  }, [savedFormData]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await deleteEvent();
      await queryClient.invalidateQueries({ queryKey: hostedEventsKeys.all });

      router.push("/hosted");
    } catch (error) {
      console.error("Failed to delete event:", error);
      setDeleting(false);
    }
  }, [deleteEvent, queryClient, router]);

  const toggleDeleteConfirm = useCallback((show: boolean) => {
    setShowDeleteConfirm(show);
  }, []);

  return {
    eventData,
    formData,
    isDirty,
    isDeadlineLocked,
    earliestSlot,
    deadlineError,
    isDeadlineValid,
    hasDeadlineRequiredError,
    updateDeadlineEnabled,
    updateDeadlineDate,
    updateDeadlineTime,
    isLoading,
    saving,
    saveSuccess,
    saveError,
    deleting,
    showDeleteConfirm,
    handleSave,
    resetForm,
    handleDelete,
    toggleDeleteConfirm,
  };
}
