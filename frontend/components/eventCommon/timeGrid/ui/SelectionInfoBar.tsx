"use client";

import { useTranslations } from "next-intl";

interface SelectionInfoBarProps {
  selectedCount: number;
  onClear: () => void;
  onSelectAll: () => void;
}

export function SelectionInfoBar({
  selectedCount,
  onClear,
  onSelectAll,
}: SelectionInfoBarProps) {
  const tJoined = useTranslations("joined");

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
      <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
        {tJoined("selectedSlots", { count: selectedCount })}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          {tJoined("clearSelection")}
        </button>
        <span className="text-gray-300 dark:text-zinc-600">|</span>
        <button
          onClick={onSelectAll}
          className="text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          {tJoined("selectAll")}
        </button>
      </div>
    </div>
  );
}
