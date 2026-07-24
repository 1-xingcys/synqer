"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ClearDeadlineConfirmModal } from "./ClearDeadlineConfirmModal";
import { VotingDeadlineFields } from "./VotingDeadlineFields";
import { useVotingDeadlineForm } from "./useVotingDeadlineForm";

const HEADING_ID = "hosted-voting-deadline-heading";

export function VotingDeadline() {
  const t = useTranslations();
  const {
    isLoading,
    formData,
    isDirty,
    isLocked,
    isValid,
    hasSavedDeadline,
    saving,
    saveSuccess,
    saveError,
    setEnabled,
    setDate,
    setTime,
    save,
    clearDeadline,
    reset,
  } = useVotingDeadlineForm();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Switching off a deadline that is already live is the one change that skips
  // the Save button: it is destructive, so it confirms and writes immediately.
  // Every other edit stays staged in the form until the host saves.
  const handleEnabledChange = useCallback(
    (enabled: boolean) => {
      if (!enabled && hasSavedDeadline) {
        setShowClearConfirm(true);
        return;
      }

      setEnabled(enabled);
    },
    [hasSavedDeadline, setEnabled],
  );

  const handleConfirmClear = useCallback(async () => {
    const cleared = await clearDeadline();
    if (cleared) {
      setShowClearConfirm(false);
    }
  }, [clearDeadline]);

  const closeClearConfirm = useCallback(() => setShowClearConfirm(false), []);

  // The action row only takes up space when there is something to act on or
  // report, so an untouched section stays at the header plus fields.
  const showActions = isDirty || saveSuccess || saveError !== null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h2
          id={HEADING_ID}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {t("createEvent.votingDeadline.enable")}
        </h2>
        <Switch
          aria-labelledby={HEADING_ID}
          checked={formData.deadlineEnabled}
          onCheckedChange={handleEnabledChange}
          disabled={isLoading || isLocked || saving}
        />
      </div>

      {isLocked && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("hosted.settingsPage.deadlineLockedDescription")}
        </p>
      )}

      {!isLoading && (
        <VotingDeadlineFields
          enabled={formData.deadlineEnabled}
          date={formData.deadlineDate}
          time={formData.deadlineTime}
          dateLabel={t("createEvent.votingDeadline.date")}
          timeLabel={t("createEvent.votingDeadline.time")}
          datePlaceholder={t("createEvent.configuration.selectDate")}
          timePlaceholder={t("createEvent.configuration.selectTime")}
          disabled={isLocked}
          onDateChange={setDate}
          onTimeChange={setTime}
        />
      )}

      {showActions && (
        <div className="flex items-center justify-end gap-3 pt-4">
          {saveError && (
            <span className="text-sm text-destructive">{saveError}</span>
          )}
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              {t("hosted.settingsPage.saved")}
            </span>
          )}

          {isDirty && (
            <>
              {!saving && (
                <Button variant="outline" onClick={reset} disabled={saving}>
                  {t("hosted.settingsPage.discard")}
                </Button>
              )}
              <Button onClick={() => void save()} disabled={!isValid}>
                {saving ? (
                  <Spinner size="sm" tone="current" className="mr-2" />
                ) : (
                  t("common.save")
                )}
              </Button>
            </>
          )}
        </div>
      )}

      <ClearDeadlineConfirmModal
        open={showClearConfirm}
        saving={saving}
        error={saveError}
        onCancel={closeClearConfirm}
        onConfirm={() => void handleConfirmClear()}
      />
    </section>
  );
}
