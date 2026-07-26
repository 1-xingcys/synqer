"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CircleHelp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PreferenceRow } from "./PreferenceRow";
import { VoteNoticeInfoModal } from "./VoteNoticeInfoModal";

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
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PreferenceRow
        label={t("shareVoteToChatLabel")}
        htmlFor={SHARE_VOTE_SWITCH_ID}
        hint={
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground"
            aria-label={t("openInfoAriaLabel")}
          >
            <CircleHelp className="h-3.5 w-3.5" />
          </button>
        }
      >
        <Switch
          id={SHARE_VOTE_SWITCH_ID}
          checked={shareVoteToChat}
          disabled={disabled}
          onCheckedChange={onShareVoteToChatChange}
        />
      </PreferenceRow>

      <VoteNoticeInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
