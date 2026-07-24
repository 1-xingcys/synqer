"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { apiFetchJson } from "@/lib/apiClient";
import type { operations } from "@/generated/openapi";
import {
  EMPTY_VOTING_DEADLINE_FORM_DATA,
  areVotingDeadlineFormsEqual,
  buildVotingDeadlineFormData,
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

  const event = eventData?.event ?? null;
  // The whole deadline is one naive-ISO string on the server, so that string
  // doubles as the sync token: the form only needs rebuilding when it changes.
  const serverDeadline = event?.votingDeadline ?? null;

  const [formData, setFormData] = useState<VotingDeadlineFormData>(
    EMPTY_VOTING_DEADLINE_FORM_DATA,
  );
  const [syncedDeadline, setSyncedDeadline] = useState<
    string | null | undefined
  >(undefined);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Adopt the server value during render rather than in an effect, so there is
  // no flash of stale form state. Unsaved edits survive every refetch that
  // leaves the deadline untouched, and are replaced only when the server value
  // itself moved — which means our own save landed, or another host edited it.
  if (event && syncedDeadline !== serverDeadline) {
    setSyncedDeadline(serverDeadline);
    setFormData(buildVotingDeadlineFormData(serverDeadline));
  }

  const savedFormData = useMemo(
    () => buildVotingDeadlineFormData(serverDeadline),
    [serverDeadline],
  );

  // Switching off keeps the picked date and time, so flipping the switch back
  // on restores what the host had rather than making them pick again.
  const setEnabled = useCallback((enabled: boolean) => {
    setFormData((prev) => ({ ...prev, deadlineEnabled: enabled }));
  }, []);

  const setDate = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, deadlineDate: date }));
  }, []);

  const setTime = useCallback((time: string) => {
    setFormData((prev) => ({ ...prev, deadlineTime: time }));
  }, []);

  const isDirty = !areVotingDeadlineFormsEqual(formData, savedFormData);
  const isLocked = isVotingDeadlineLocked(event);
  const isValid = getVotingDeadlineError(formData) === null;

  const persist = useCallback(
    async (votingDeadline: string | null | undefined) => {
      try {
        setSaving(true);
        setSaveError(null);

        const payload: UpdateEventRequest = { votingDeadline };

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
        return true;
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Failed to save settings",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [eventId, refetch],
  );

  const save = useCallback(async () => {
    if (isLocked || !isDirty || !isValid) return false;

    return persist(toVotingDeadlinePayload(formData));
  }, [formData, isDirty, isLocked, isValid, persist]);

  /**
   * Clearing a deadline participants can already see is destructive, so the UI
   * confirms first and then writes immediately — nothing is staged in the form,
   * which keeps the switch honest if the request fails.
   */
  const clearDeadline = useCallback(async () => {
    if (isLocked) return false;

    return persist(null);
  }, [isLocked, persist]);

  const reset = useCallback(() => {
    setSaveError(null);
    setSaveSuccess(false);
    setFormData(buildVotingDeadlineFormData(serverDeadline));
  }, [serverDeadline]);

  return {
    isLoading: isEventLoading && !event,
    formData,
    isDirty,
    isLocked,
    isValid,
    /** 伺服器上已有截止時間，關閉開關等於刪掉參與者看得到的資訊 */
    hasSavedDeadline: serverDeadline !== null,
    saving,
    saveSuccess,
    saveError,
    setEnabled,
    setDate,
    setTime,
    save,
    clearDeadline,
    reset,
  };
}
