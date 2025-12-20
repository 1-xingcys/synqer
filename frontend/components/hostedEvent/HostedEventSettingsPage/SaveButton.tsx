"use client";

import { useTranslations } from "next-intl";

interface SaveButtonProps {
  saving: boolean;
  saveSuccess: boolean;
  onClick: () => void;
}

export function SaveButton({ saving, saveSuccess, onClick }: SaveButtonProps) {
  const t = useTranslations();

  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
    >
      {saving ? (
        <>
          <LoadingSpinner />
          {t("common.saving")}
        </>
      ) : saveSuccess ? (
        <>
          <CheckIcon />
          {t("hosted.settingsPage.saved")}
        </>
      ) : (
        t("hosted.settingsPage.saveChanges")
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
