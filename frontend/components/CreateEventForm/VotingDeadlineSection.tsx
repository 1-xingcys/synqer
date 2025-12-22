"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { combineDateAndTime } from "./types";

interface VotingDeadlineSectionProps {
  votingDeadline: Date | null;
  votingDeadlineTime: string;
  startDate: Date | null;
  startTime: string;
  isManuallySet: boolean;
  hasError: boolean;
  onDeadlineDateChange: (date: Date | null) => void;
  onDeadlineTimeChange: (time: string) => void;
}

export function VotingDeadlineSection({
  votingDeadline,
  votingDeadlineTime,
  startDate,
  startTime,
  isManuallySet,
  hasError: _hasError,
  onDeadlineDateChange,
  onDeadlineTimeChange,
}: VotingDeadlineSectionProps) {
  const t = useTranslations();

  // Calculate if deadline is after event start
  const isDeadlineInvalid = useMemo(() => {
    if (!votingDeadline || !startDate) return false;

    const deadlineDateTime = combineDateAndTime(
      votingDeadline,
      votingDeadlineTime,
    );
    const startDateTime = combineDateAndTime(startDate, startTime);

    return deadlineDateTime > startDateTime;
  }, [votingDeadline, votingDeadlineTime, startDate, startTime]);

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
              {t("createEvent.votingDeadline.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("createEvent.votingDeadline.description")}
            </p>
          </div>

          {/* Deadline Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("createEvent.votingDeadline.date")}</Label>
              <DatePicker
                value={votingDeadline}
                onChange={onDeadlineDateChange}
                placeholder={t("createEvent.configuration.selectDate")}
                maxDate={startDate || undefined}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("createEvent.votingDeadline.time")}</Label>
              <TimePicker
                value={votingDeadlineTime}
                onChange={onDeadlineTimeChange}
                type="start"
              />
            </div>
          </div>

          {/* Auto-sync indicator */}
          {!isManuallySet && (
            <p className="text-xs text-primary flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              {t("createEvent.votingDeadline.autoSync")}
            </p>
          )}

          {/* Error message */}
          {isDeadlineInvalid && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.votingDeadline.error")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
