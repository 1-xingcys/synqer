"use client";

import { useTranslations } from "next-intl";
import { VoteNoticeFields } from "@/components/eventCommon/eventPreference";
import { useEventPreference } from "./useEventPreference";

export function VoteNoticeSection() {
  const t = useTranslations();
  const { isLoading, shareVoteToChat, hasError, setShareVoteToChat } =
    useEventPreference();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t("hosted.settingsPage.preference.voteNoticeTitle")}
      </h2>

      <hr className="my-2 border-t border-gray-300" />

      <VoteNoticeFields
        shareVoteToChat={shareVoteToChat}
        disabled={isLoading}
        onShareVoteToChatChange={setShareVoteToChat}
      />

      {hasError && (
        <p className="text-sm text-destructive">
          {t("hosted.settingsPage.preference.saveError")}
        </p>
      )}
    </section>
  );
}
