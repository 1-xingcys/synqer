"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface ConfigurationSectionProps {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  hasTimeError?: boolean;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function ConfigurationSection({
  startDate,
  endDate,
  startTime,
  endTime,
  hasTimeError = false,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: ConfigurationSectionProps) {
  const t = useTranslations();

  // Min date for date picker (currently unused but kept for future use)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            2
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t("createEvent.configuration.title")}
            </h2>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.startDate")}</Label>
              <DatePicker
                value={startDate}
                onChange={onStartDateChange}
                placeholder={t("createEvent.configuration.selectDate")}
                // minDate={minDate}
                // maxDate={endDate || undefined}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.endDate")}</Label>
              <DatePicker
                value={endDate}
                onChange={onEndDateChange}
                placeholder={t("createEvent.configuration.selectDate")}
                // minDate={startDate || minDate}
              />
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.startTime")}</Label>
              <TimePicker
                value={startTime}
                onChange={onStartTimeChange}
                type="start"
                hasError={hasTimeError}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.endTime")}</Label>
              <TimePicker
                value={endTime}
                onChange={onEndTimeChange}
                type="end"
                hasError={hasTimeError}
              />
            </div>
          </div>

          {/* Time Error Message */}
          {hasTimeError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.configuration.timeError")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
