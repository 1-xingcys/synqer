"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { PreferenceRow } from "./PreferenceRow";

interface VoteNoticeFieldsProps {
  shareVoteToChat: boolean;
  onShareVoteToChatChange: (shareVoteToChat: boolean) => void;
  disabled?: boolean;
}

const SHARE_VOTE_SWITCH_ID = "vote-notice-share-to-chat";

/**
 * What participants broadcast when they vote.
 *
 * Unlike the grid defaults, this one is binding on participants rather than a
 * starting point they can override: it decides whether committing a vote posts
 * a notice into the chat they voted from.
 */
export function VoteNoticeFields({
  shareVoteToChat,
  onShareVoteToChatChange,
  disabled = false,
}: VoteNoticeFieldsProps) {
  const t = useTranslations("eventPreference.voteNotice");

  return (
    <div className="space-y-4">
      <PreferenceRow
        label={t("shareVoteToChatLabel")}
        htmlFor={SHARE_VOTE_SWITCH_ID}
      >
        <Switch
          id={SHARE_VOTE_SWITCH_ID}
          checked={shareVoteToChat}
          disabled={disabled}
          onCheckedChange={onShareVoteToChatChange}
        />
      </PreferenceRow>
    </div>
  );
}
