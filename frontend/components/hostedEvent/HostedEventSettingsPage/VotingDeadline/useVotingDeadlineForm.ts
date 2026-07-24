"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { apiFetchJson } from "@/lib/apiClient";
import { VOTING_DEADLINE_ERROR } from "@/lib/votingDeadline";
import type { operations } from "@/generated/openapi";
import {
  EMPTY_VOTING_DEADLINE_FORM_DATA,
  areVotingDeadlineFormsEqual,
  buildVotingDeadlineFormData,
  cloneVotingDeadlineFormData,
  getVotingDeadlineError,
  isVotingDeadlineLocked,
  toVotingDeadlinePayload,
  type VotingDeadlineFormData,
} from "./votingDeadlineForm";

type UpdateEventRequest =
  operations["EventCoreController_update"]["requestBody"]["content"]["application/json"];
type UpdateEventResponse =
  operations["EventCoreController_update"]["responses"][200]["content"]["application/json"];

const SAVE_SUCCESS_DURATION_MS = 3000;

/**
 * 投票截止時間區塊的狀態：本地表單、與伺服器版本的差異、以及儲存流程。
 */
export function useVotingDeadlineForm() {
  const params = useParams();
  const eventId = params.eventId as string;
  const {
    data: eventData,
    isLoading: isEventLoading,
    refetch,
  } = useHostedEventDetail(eventId);

  const [formData, setFormData] = useState<VotingDeadlineFormData>(
    EMPTY_VOTING_DEADLINE_FORM_DATA,
  );
  const [savedFormData, setSavedFormData] =
    useState<VotingDeadlineFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const setEnabled = useCallback((enabled: boolean) => {
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

  const setDate = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, deadlineDate: date }));
  }, []);

  const setTime = useCallback((time: string) => {
    setFormData((prev) => ({ ...prev, deadlineTime: time }));
  }, []);

  const isDirty = useMemo(() => {
    if (!savedFormData) return false;
    return !areVotingDeadlineFormsEqual(formData, savedFormData);
  }, [formData, savedFormData]);

  const isLocked = useMemo(
    () => isVotingDeadlineLocked(eventData?.event),
    [eventData?.event],
  );

  const deadlineError = useMemo(() => {
    if (!eventData?.event) return null;
    return getVotingDeadlineError(formData);
  }, [eventData?.event, formData]);

  const save = useCallback(async () => {
    if (!isDirty) return;

    if (isLocked || deadlineError !== null) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const payload: UpdateEventRequest = {
        votingDeadline: toVotingDeadlinePayload(formData),
      };

      await apiFetchJson<UpdateEventResponse>(`/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), SAVE_SUCCESS_DURATION_MS);
      await refetch();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  }, [deadlineError, eventId, formData, isDirty, isLocked, refetch]);

  const reset = useCallback(() => {
    if (!savedFormData) return;

    setSaveError(null);
    setSaveSuccess(false);
    setFormData(cloneVotingDeadlineFormData(savedFormData));
  }, [savedFormData]);

  return {
    isLoading: isEventLoading && !eventData,
    formData,
    isDirty,
    isLocked,
    isValid: deadlineError === null,
    hasRequiredError: deadlineError === VOTING_DEADLINE_ERROR.REQUIRED,
    saving,
    saveSuccess,
    saveError,
    setEnabled,
    setDate,
    setTime,
    save,
    reset,
  };
}
