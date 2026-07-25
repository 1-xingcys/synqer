"use client";

import { useTranslations } from "next-intl";
import { EventPreferenceFields } from "@/components/eventCommon/EventPreferenceFields";
import type { VoteMode } from "@/types/event";
import type { TimeGranularity } from "@/components/eventCommon/timeGrid/types";
import { useFormStateContext } from "./CreateEventFormContext";

export function PreferenceSection() {
  const t = useTranslations();

  const {
    state: { formData, setFormData },
  } = useFormStateContext();

  const handleGranularityChange = (granularity: TimeGranularity) => {
    setFormData((prev) => ({ ...prev, defaultGranularityMin: granularity }));
  };

  const handleVoteModeChange = (voteMode: VoteMode) => {
    setFormData((prev) => ({ ...prev, defaultVoteMode: voteMode }));
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
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t("createEvent.preference.title")}
            </h2>
          </div>

          <EventPreferenceFields
            granularity={formData.defaultGranularityMin}
            voteMode={formData.defaultVoteMode}
            showPreviewGrid
            onGranularityChange={handleGranularityChange}
            onVoteModeChange={handleVoteModeChange}
          />
        </div>
      </div>
    </div>
  );
}
