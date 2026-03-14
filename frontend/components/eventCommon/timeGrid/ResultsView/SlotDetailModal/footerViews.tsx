"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Plus } from "lucide-react";

interface AddButtonViewProps {
  isVotingPhase: boolean;
  onAdd: () => void;
  tHosted: ReturnType<typeof useTranslations>;
}

export function AddButtonView({
  isVotingPhase,
  onAdd,
  tHosted,
}: AddButtonViewProps) {
  return (
    <>
      <button
        onClick={onAdd}
        className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {tHosted("addToEventTime.button")}
      </button>
      {isVotingPhase && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {tHosted("addToEventTime.votingHint")}
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
