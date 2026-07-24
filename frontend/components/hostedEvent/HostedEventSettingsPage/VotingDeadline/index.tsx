"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { VotingDeadlineFields } from "./VotingDeadlineFields";
import { useVotingDeadlineForm } from "./useVotingDeadlineForm";

export function VotingDeadline() {
  const t = useTranslations();
  const {
    isLoading,
    formData,
    isDirty,
    isLocked,
    isValid,
    hasRequiredError,
    saving,
    saveSuccess,
    saveError,
    setEnabled,
    setDate,
    setTime,
    save,
    reset,
  } = useVotingDeadlineForm();

  return (
    <div
      className={`border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden ${isLocked ? "opacity-60" : ""}`}
    >
      {/* Section Header */}
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {t("createEvent.votingDeadline.title")}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {isLocked
            ? t("hosted.settingsPage.deadlineLockedDescription")
            : t("createEvent.votingDeadline.description")}
        </p>
      </div>

      {/* Section Content */}
      <div className="p-4 bg-white dark:bg-zinc-900">
        {isLoading ? (
          <LoadingState
            label={t("common.loading")}
            viewport="none"
            layout="row"
            textSize="sm"
            spinnerSize="sm"
            className="py-6"
          />
        ) : (
          <>
            <VotingDeadlineFields
              enabled={formData.deadlineEnabled}
              date={formData.deadlineDate}
              time={formData.deadlineTime}
              enableLabel={t("createEvent.votingDeadline.enable")}
              dateLabel={t("createEvent.votingDeadline.date")}
              timeLabel={t("createEvent.votingDeadline.time")}
              datePlaceholder={t("createEvent.configuration.selectDate")}
              errorMessage={
                hasRequiredError
                  ? t("createEvent.votingDeadline.errorRequired")
                  : undefined
              }
              disabled={isLocked}
              onEnabledChange={setEnabled}
              onDateChange={setDate}
              onTimeChange={setTime}
            />

            {/* Save Button */}
            {!isLocked && (
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
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
                  <Button variant="outline" onClick={reset} disabled={saving}>
                    {t("hosted.settingsPage.discard")}
                  </Button>
                )}

                <Button
                  onClick={() => void save()}
                  disabled={saving || !isValid || !isDirty}
                >
                  {saving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
