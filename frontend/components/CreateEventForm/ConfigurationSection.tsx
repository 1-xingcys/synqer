"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";
import { useFormStateContext } from "./CreateEventFormContext";
import { useDateTimeFields } from "./hooks/useDateTimeFields";
import { ValidationError } from "./hooks/useFormValidation";
import { getToday } from "./hooks/utils";

export function ConfigurationSection() {
  const t = useTranslations();

  const {
    state: { formData, setFormData },
    validation: { errors },
  } = useFormStateContext();

  const {
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
  } = useDateTimeFields(setFormData);

  const today = getToday();

  const hasTimeError = errors.has(ValidationError.StartTimeAfterEndTime);
  const hasStartTimeTooSoonError = errors.has(ValidationError.StartTimeTooSoon);

  return (
    <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative">
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
            <p className="text-xs text-muted-foreground">
              {t("createEvent.configuration.description")}
            </p>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.startDate")}</Label>
              <DatePicker
                value={formData.startDate}
                onChange={handleStartDateChange}
                placeholder={t("createEvent.configuration.selectDate")}
                minDate={today}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.endDate")}</Label>
              <DatePicker
                value={formData.endDate}
                onChange={handleEndDateChange}
                placeholder={t("createEvent.configuration.selectDate")}
                minDate={formData.startDate || today}
              />
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.startTime")}</Label>
              <TimePicker
                value={formData.startTime}
                onChange={handleStartTimeChange}
                type="start"
                hasError={hasTimeError}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("createEvent.configuration.endTime")}</Label>
              <TimePicker
                value={formData.endTime}
                onChange={handleEndTimeChange}
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

          {/* Start Time Too Soon Error */}
          {hasStartTimeTooSoonError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.configuration.startTimeTooSoonError")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
