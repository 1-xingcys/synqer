"use client";

import { useTranslations } from "next-intl";
import { Check, Calendar } from "lucide-react";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { ConfirmedTimeRange } from "@/types/event";
import { TimeSlot } from "@/components/eventCommon/timeGrid/types";

interface CompletedViewProps {
  confirmedTimeRanges: ConfirmedTimeRange[];
  slots?: TimeSlot[];
}

export function CompletedView({
  confirmedTimeRanges,
  slots,
}: CompletedViewProps) {
  const t = useTranslations("joined");

  return (
    <div className="p-6 space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Check className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {t("completed.title")}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("completed.description")}
        </p>
      </div>

      {/* Confirmed Time Display */}
      {confirmedTimeRanges.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t("confirmed.eventTime")}
          </h4>
          <ConfirmedTimeDisplay
            timeRanges={confirmedTimeRanges}
            slots={slots}
            className="text-zinc-600 dark:text-zinc-400"
          />
        </div>
      )}
    </div>
  );
}
