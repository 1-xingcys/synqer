"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { GridDefaultFields } from "@/features/event-preference/GridDefaultFields";
import { VoteNoticeFields } from "@/features/event-preference/VoteNoticeFields";
import type { VoteMode } from "@/types/event";
import type { TimeGranularity } from "@/types/event";
import { cn } from "@/lib/utils";
import { useFormStateContext } from "./CreateEventFormContext";

const PREFERENCE_CONTENT_ID = "create-event-preference-content";

export function PreferenceSection() {
  const t = useTranslations();

  const [isExpanded, setIsExpanded] = useState(false);

  const {
    state: { formData, setFormData },
  } = useFormStateContext();

  const handleGranularityChange = (granularity: TimeGranularity) => {
    setFormData((prev) => ({ ...prev, defaultGranularityMin: granularity }));
  };

  const handleVoteModeChange = (voteMode: VoteMode) => {
    setFormData((prev) => ({ ...prev, defaultVoteMode: voteMode }));
  };

  const handleShareVoteToChatChange = (shareVoteToChat: boolean) => {
    setFormData((prev) => ({ ...prev, shareVoteToChat }));
  };

  return (
    <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            3
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls={PREFERENCE_CONTENT_ID}
            className="flex w-fit items-center gap-1.5 text-left cursor-pointer"
          >
            <h2 className="text-base font-semibold text-foreground">
              {t("createEvent.preference.title")}
            </h2>
            <ChevronDown
              className={cn(
                "w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>

          <div
            id={PREFERENCE_CONTENT_ID}
            className={cn(
              "grid transition-all duration-300 ease-in-out motion-reduce:transition-none",
              isExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
            inert={!isExpanded}
          >
            <div className="overflow-hidden">
              <div className="pt-4 space-y-4">
                <VoteNoticeFields
                  shareVoteToChat={formData.shareVoteToChat}
                  onShareVoteToChatChange={handleShareVoteToChatChange}
                />
                <GridDefaultFields
                  granularity={formData.defaultGranularityMin}
                  voteMode={formData.defaultVoteMode}
                  showPreview
                  onGranularityChange={handleGranularityChange}
                  onVoteModeChange={handleVoteModeChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
