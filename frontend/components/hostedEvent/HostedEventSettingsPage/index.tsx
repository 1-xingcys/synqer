"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { VotingDeadlineFields } from "@/components/eventCommon/VotingDeadlineFields";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { VOTING_DEADLINE_ERROR } from "@/lib/votingDeadline";
import { useEventSettings } from "./useEventSettings";
import { DangerZone } from "./DangerZone";
import { EventStatus } from "@/types/event";

export default function HostedEventSettingsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const {
    eventData,
    formData,
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
    handleDelete,
    toggleDeleteConfirm,
  } = useEventSettings(eventId);

  if (isLoading && (!eventData || !earliestSlot || !formData)) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  // Check if voting is no longer allowed (vote ended, confirmed, complete)
  const isVotingDisabled =
    eventData?.event.status === EventStatus.VOTING_ENDED ||
    eventData?.event.status === EventStatus.CONFIRMED ||
    eventData?.event.status === EventStatus.COMPLETED;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Voting Deadline Section */}
      <div
        className={`border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden ${isVotingDisabled ? "opacity-60" : ""}`}
      >
        {/* Section Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("createEvent.votingDeadline.title")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isVotingDisabled
              ? t("hosted.settingsPage.votingEndedDescription")
              : t("createEvent.votingDeadline.description")}
          </p>
        </div>

        {/* Section Content */}
        <div className="p-4 bg-white dark:bg-zinc-900">
          <VotingDeadlineFields
            checkboxId="hosted-enable-voting-deadline"
            enabled={formData.deadlineEnabled}
            date={formData.deadlineDate}
            time={formData.deadlineTime}
            enableLabel={t("createEvent.votingDeadline.enable")}
            description={
              formData.deadlineEnabled
                ? t("createEvent.votingDeadline.description")
                : t("hosted.deadline.notSet")
            }
            dateLabel={t("createEvent.votingDeadline.date")}
            timeLabel={t("createEvent.votingDeadline.time")}
            datePlaceholder={t("createEvent.configuration.selectDate")}
            maxDate={earliestSlot?.date}
            errorMessage={
              hasDeadlineRequiredError
                ? t("createEvent.votingDeadline.errorRequired")
                : deadlineError === VOTING_DEADLINE_ERROR.IN_PAST
                  ? t("createEvent.votingDeadline.errorInPast")
                  : deadlineError === VOTING_DEADLINE_ERROR.AFTER_MAX
                    ? t("hosted.settingsPage.deadlineBeforeFirstSlot")
                    : undefined
            }
            enableLabelClassName="text-sm font-medium cursor-pointer text-zinc-700 dark:text-zinc-300"
            descriptionClassName="text-sm text-zinc-600 dark:text-zinc-400"
            fieldLabelClassName="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            disabled={isVotingDisabled}
            onEnabledChange={updateDeadlineEnabled}
            onDateChange={updateDeadlineDate}
            onTimeChange={updateDeadlineTime}
          />

          {/* Save Button */}
          {!isVotingDisabled && (
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

              <Button
                onClick={() => void handleSave()}
                disabled={saving || !isDeadlineValid}
              >
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <DangerZone
        showDeleteConfirm={showDeleteConfirm}
        deleting={deleting}
        onDeleteClick={() => toggleDeleteConfirm(true)}
        onConfirmDelete={() => void handleDelete()}
        onCancelDelete={() => toggleDeleteConfirm(false)}
      />
    </div>
  );
}
