"use client";

import { useTranslations } from "next-intl";
import { Loader2, AlertTriangle, Plus } from "lucide-react";

interface VotingConfirmViewProps {
  isAdding: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  tHosted: ReturnType<typeof useTranslations>;
}

export function VotingConfirmView({
  isAdding,
  onCancel,
  onConfirm,
  tHosted,
}: VotingConfirmViewProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1.5">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {tHosted("addToEventTime.votingConfirmHint")}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isAdding}
          className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {tHosted("addToEventTime.cancel")}
        </button>
        <button
          onClick={onConfirm}
          disabled={isAdding}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {tHosted("addToEventTime.adding")}
            </>
          ) : (
            tHosted("addToEventTime.confirm")
          )}
        </button>
      </div>
    </div>
  );
}

interface AddButtonViewProps {
  isAdding: boolean;
  isVotingPhase: boolean;
  onAdd: () => void;
  tHosted: ReturnType<typeof useTranslations>;
}

export function AddButtonView({
  isAdding,
  isVotingPhase,
  onAdd,
  tHosted,
}: AddButtonViewProps) {
  return (
    <>
      <button
        onClick={onAdd}
        disabled={isAdding}
        className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isAdding ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {tHosted("addToEventTime.adding")}
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            {tHosted("addToEventTime.button")}
          </>
        )}
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
