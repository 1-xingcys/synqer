"use client";

import { useTranslations } from "next-intl";
import { GridDefaultFields } from "@/components/eventCommon/eventPreference";
import { useEventPreference } from "./useEventPreference";

export function GridDefaultSection() {
  const t = useTranslations();
  const {
    isLoading,
    granularity,
    voteMode,
    hasError,
    setGranularity,
    setVoteMode,
  } = useEventPreference();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t("hosted.settingsPage.preference.gridDefaultTitle")}
      </h2>

      <hr className="my-2 border-t border-gray-300" />

      <GridDefaultFields
        granularity={granularity}
        voteMode={voteMode}
        disabled={isLoading}
        onGranularityChange={setGranularity}
        onVoteModeChange={setVoteMode}
      />

      {hasError && (
        <p className="text-sm text-destructive">
          {t("hosted.settingsPage.preference.saveError")}
        </p>
      )}
    </section>
  );
}
