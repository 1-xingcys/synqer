"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

interface ResetButtonProps {
  onClick: () => void;
  isResetting: boolean;
}

export function ResetButton({ onClick, isResetting }: ResetButtonProps) {
  const t = useTranslations("hosted");

  return (
    <button
      onClick={onClick}
      disabled={isResetting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
    >
      {isResetting ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <RotateCcw className="w-3 h-3" />
      )}
      {t("eventTimeSelector.reset")}
    </button>
  );
}
