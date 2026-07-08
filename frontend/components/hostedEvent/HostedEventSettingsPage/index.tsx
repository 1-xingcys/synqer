"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { VotingDeadlineFields } from "@/components/eventCommon/VotingDeadlineFields";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { VOTING_DEADLINE_ERROR } from "@/lib/votingDeadline";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { useEventSettings } from "./useEventSettings";
import { DangerZone } from "./DangerZone";

export default function HostedEventSettingsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const {
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
  } = useEventSettings(eventId);

  const { shareUrl, copied: linkCopied, copyLink } = useEventShareLink(eventId);

  if (isLoading && (!eventData || !earliestSlot || !formData)) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Invite Link Section */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("hosted.settingsPage.inviteLink.title")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t("hosted.settingsPage.inviteLink.description")}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-3 pr-1 py-1">
            <div className="relative flex-1 min-w-0 overflow-hidden">
              <div className="whitespace-nowrap py-1 text-sm text-zinc-700 dark:text-zinc-300">
                {shareUrl}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-800" />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void copyLink()}
              aria-label={t("hosted.settingsPage.inviteLink.copy")}
              className="shrink-0"
            >
              {linkCopied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Voting Deadline Section */}
      <div
        className={`border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden ${isDeadlineLocked ? "opacity-60" : ""}`}
      >
        {/* Section Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("createEvent.votingDeadline.title")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isDeadlineLocked
              ? t("hosted.settingsPage.deadlineLockedDescription")
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
            fieldLabelClassName="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            disabled={isDeadlineLocked}
            onEnabledChange={updateDeadlineEnabled}
            onDateChange={updateDeadlineDate}
            onTimeChange={updateDeadlineTime}
          />

          {/* Save Button */}
          {!isDeadlineLocked && (
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
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  {t("hosted.settingsPage.discard")}
                </Button>
              )}

              <Button
                onClick={() => void handleSave()}
                disabled={saving || !isDeadlineValid || !isDirty}
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
