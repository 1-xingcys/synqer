"use client";

import { useTranslations } from "next-intl";
import { CheckCheck, AlertCircle } from "lucide-react";

export function VoteStatusText({ hasVoted }: { hasVoted: boolean }) {
  const t = useTranslations();

  return hasVoted ? (
    <span className="inline-flex items-center gap-1.5 text-xs sm:text-base text-emerald-600 dark:text-emerald-400 font-medium">
      <CheckCheck className="w-4 h-4" />
      {t("joined.voted")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs sm:text-base text-amber-600 dark:text-amber-400 font-medium">
      <AlertCircle className="w-4 h-4" />
      {t("joined.notVoted")}
    </span>
  );
}
