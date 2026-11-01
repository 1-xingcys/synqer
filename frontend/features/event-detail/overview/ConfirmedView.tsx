"use client";

import { useTranslations } from "next-intl";
import { CalendarCheck, Calendar } from "lucide-react";
import { ConfirmedTimeDisplay } from "@/components/event/ConfirmedTimeDisplay";
import { AddToCalendarPanel } from "./AddToCalendarPanel";
import { ConfirmedSelection } from "@/types/event";
import { isOneTimeConfirmedSelection } from "@/lib/event/event-time";

interface ConfirmedViewProps {
  eventTitle: string;
  eventDescription?: string | null;
  confirmedSelections: ConfirmedSelection[];
  supportsAddToCalendar: boolean;
  timeZone: string;
}

export function ConfirmedView({
  eventTitle,
  eventDescription,
  confirmedSelections,
  supportsAddToCalendar,
  timeZone,
}: ConfirmedViewProps) {
  const t = useTranslations("joined");
  const hasDisplayableConfirmedTime = confirmedSelections.length > 0;
  const oneTimeConfirmedSelections = confirmedSelections.filter(
    isOneTimeConfirmedSelection,
  );

  return (
    <div className="p-6 space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
          <CalendarCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {t("confirmed.title")}
        </h3>
      </div>

      {/* Confirmed Time Display */}
      {hasDisplayableConfirmedTime && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t("confirmed.eventTime")}
          </h4>
          <ConfirmedTimeDisplay
            selections={confirmedSelections}
            className="text-emerald-700 dark:text-emerald-400"
          />
        </div>
      )}

      {/* Add to Google Calendar */}
      {supportsAddToCalendar && oneTimeConfirmedSelections.length > 0 && (
        <AddToCalendarPanel
          eventTitle={eventTitle}
          eventDescription={eventDescription}
          oneTimeConfirmedSelections={oneTimeConfirmedSelections}
          timeZone={timeZone}
        />
      )}
    </div>
  );
}
