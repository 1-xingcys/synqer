"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEventSettings } from "./useEventSettings";
import { SettingsForm } from "./SettingsForm";
import { SaveButton } from "./SaveButton";
import { DangerZone } from "./DangerZone";

export default function HostedEventSettingsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const {
    formData,
    updateField,
    loading,
    saving,
    saveSuccess,
    deleting,
    showDeleteConfirm,
    handleSave,
    handleDelete,
    toggleDeleteConfirm,
  } = useEventSettings(eventId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("hosted.settingsPage.title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("hosted.settingsPage.description")}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <SettingsForm formData={formData} onFieldChange={updateField} />

        {/* Save Button */}
        <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800">
          <SaveButton
            saving={saving}
            saveSuccess={saveSuccess}
            onClick={() => void handleSave()}
          />
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
