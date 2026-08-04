"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2, Plus } from "lucide-react";

interface AddButtonViewProps {
  isVotingPhase: boolean;
  onAdd: () => void;
  isLoading: boolean;
}

export function AddButtonView({
  isVotingPhase,
  onAdd,
  isLoading,
}: AddButtonViewProps) {
  const t = useTranslations("hosted");
  return (
    <>
      <button
        onClick={onAdd}
        disabled={isLoading}
        className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {isLoading ? t("addToEventTime.adding") : t("addToEventTime.button")}
      </button>
      {isVotingPhase && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {t("addToEventTime.votingHint")}
        </p>
      )}
    </>
  );
}

interface CloseButtonViewProps {
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}

export function CloseButtonView({ onClose, t }: CloseButtonViewProps) {
  return (
    <button
      onClick={onClose}
      className="sm:hidden w-full py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
    >
      {t("results.close")}
    </button>
  );
}
