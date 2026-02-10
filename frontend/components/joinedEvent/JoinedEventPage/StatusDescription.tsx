"use client";

import { useTranslations } from "next-intl";

interface VotingInstructionProps {
  className?: string;
}

/**
 * 投票階段說明文字
 */
export function VotingInstruction({ className = "" }: VotingInstructionProps) {
  const t = useTranslations();

  return (
    <p
      className={`text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 ${className}`}
    >
      {t("eventInfo.statusDesc.voting")}
    </p>
  );
}
