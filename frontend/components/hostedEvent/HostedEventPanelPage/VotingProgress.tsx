"use client";

import { useTranslations } from "next-intl";
import { VotingProgress as VotingProgressUI } from "@/components/ui/VotingProgress";

interface VotingProgressProps {
  votingPercentage: number;
  totalVoted: number;
  totalExpected: number;
}

export function VotingProgress({
  votingPercentage,
  totalVoted,
  totalExpected,
}: VotingProgressProps) {
  const t = useTranslations("hosted");

  return (
    <VotingProgressUI
      title={t("votingProgress")}
      votingPercentage={votingPercentage}
      totalVoted={totalVoted}
      totalExpected={totalExpected}
    />
  );
}
