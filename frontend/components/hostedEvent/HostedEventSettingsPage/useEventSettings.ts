import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { VOTING_DEADLINE_ERROR } from "@/lib/votingDeadline";
import { apiFetchJson } from "@/lib/apiClient";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";
import { myEventsKeys } from "@/hooks/useMyEvents";
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
} from "./VotingDeadline/votingDeadlineForm";

type UpdateEventRequest =
  operations["EventCoreController_update"]["requestBody"]["content"]["application/json"];
type UpdateEventResponse =
  operations["EventCoreController_update"]["responses"][200]["content"]["application/json"];
type RemoveEventResponse =
  operations["EventCoreController_remove"]["responses"][200]["content"]["application/json"];

export function useEventSettings(eventId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: eventData, isLoading, refetch } = useHostedEventDetail(eventId);

  const [formData, setFormData] = useState<VotingDeadlineFormData>(
    EMPTY_VOTING_DEADLINE_FORM_DATA,
  );
  const [savedFormData, setSavedFormData] =
    useState<VotingDeadlineFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const isDeadlineLocked = useMemo(
    () => isVotingDeadlineLocked(eventData?.event),
    [eventData?.event],
  );

  const deadlineError = useMemo(() => {
    if (!eventData?.event) return null;
    return getVotingDeadlineError(formData);
  }, [eventData?.event, formData]);

  const isDeadlineValid = deadlineError === null;
  const hasDeadlineRequiredError =
    deadlineError === VOTING_DEADLINE_ERROR.REQUIRED;

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    if (isDeadlineLocked || deadlineError !== null) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      await updateVotingDeadline(toVotingDeadlinePayload(formData));

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
    deadlineError,
    formData,
    isDeadlineLocked,
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
      await queryClient.invalidateQueries({ queryKey: myEventsKeys.all });

      router.push(DEFAULT_OVERVIEW_PATH);
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
