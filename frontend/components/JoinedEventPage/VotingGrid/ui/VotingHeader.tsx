"use client";

import { useTranslations } from "next-intl";

interface VotingHeaderProps {
  saving: boolean;
  onSave: () => void;
}

export function VotingHeader({ saving, onSave }: VotingHeaderProps) {
  const t = useTranslations("event");

  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm text-sm"
    >
      {saving ? t("saving") : t("save")}
    </button>
  );
}
