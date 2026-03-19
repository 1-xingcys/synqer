"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, Calendar } from "lucide-react";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { AddToCalendarPanel } from "./AddToCalendarPanel";
import { ConfirmedSelection, ConfirmedTimeRange } from "@/types/event";

interface ConfirmedViewProps {
  eventTitle: string;
  eventDescription?: string | null;
  confirmedSelections: ConfirmedSelection[];
  confirmedTimeRanges: ConfirmedTimeRange[];
  supportsAddToCalendar: boolean;
}

export function ConfirmedView({
  eventTitle,
  eventDescription,
  confirmedSelections,
  confirmedTimeRanges,
  supportsAddToCalendar,
}: ConfirmedViewProps) {
  const t = useTranslations("joined");

  return (
    <div className="p-6 space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {t("confirmed.title")}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("confirmed.description")}
        </p>
      </div>

      {/* Confirmed Time Display */}
      {confirmedTimeRanges.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t("confirmed.eventTime")}
          </h4>
          <ConfirmedTimeDisplay
            selections={confirmedSelections}
            timeRanges={confirmedTimeRanges}
            className="text-green-700 dark:text-green-400"
          />
        </div>
      )}

      {/* Add to Google Calendar */}
      {supportsAddToCalendar && confirmedTimeRanges.length > 0 && (
        <AddToCalendarPanel
          eventTitle={eventTitle}
          eventDescription={eventDescription}
          confirmedTimeRanges={confirmedTimeRanges}
        />
      )}
    </div>
  );
}
