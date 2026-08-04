"use client";

import { useTranslations } from "next-intl";
import { SearchInput, SaveButton } from ".";

interface ActiveLayoutProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  selectedCount: number;
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  children: React.ReactNode;
}

export function ActiveLayout({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  selectedCount,
  saving,
  saveSuccess,
  onSave,
  children,
}: ActiveLayoutProps) {
  const t = useTranslations();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Search Input - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {t("hosted.participantsPage.selectedCount", {
              count: selectedCount,
            })}
          </span>
        </div>
      </div>

      {/* List Content */}
      <div className="max-h-[60vh] overflow-y-auto">{children}</div>

      {/* Save Button - Sticky Bottom */}
      <div className="sticky bottom-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <SaveButton
          saving={saving}
          saveSuccess={saveSuccess}
          onClick={onSave}
        />
      </div>
    </div>
  );
}
