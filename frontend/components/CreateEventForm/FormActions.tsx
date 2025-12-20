"use client";

import { useTranslations } from "next-intl";

interface FormActionsProps {
  loading: boolean;
  isFormValid: boolean;
  onCancel: () => void;
}

export function FormActions({
  loading,
  isFormValid,
  onCancel,
}: FormActionsProps) {
  const t = useTranslations();

  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        {t("createEvent.cancel")}
      </button>
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className="px-4 py-1.5 text-sm border border-transparent rounded-md font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? t("createEvent.creating") : t("createEvent.create")}
      </button>
    </div>
  );
}
