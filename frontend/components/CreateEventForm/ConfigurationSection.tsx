"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";
import { useFormStateContext } from "./CreateEventFormContext";
import { useDateTimeFields } from "./hooks/useDateTimeFields";
import { ValidationError } from "./hooks/useFormValidation";
import { VotingDeadlineFields } from "./VotingDeadlineFields";
import { todayInZone } from "@/lib/calendarDay";
import { cn } from "@/lib/utils";
import { formatWeekdayLabel, getOrderedWeekdays } from "@/lib/weekdays";

export function ConfigurationSection() {
  const t = useTranslations();
  const locale = useLocale();

  const {
    state: { formData, setFormData },
    validation: { errors },
  } = useFormStateContext();

  const {
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleTimeZoneChange,
    handleVotingDeadlineEnabledChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
  } = useDateTimeFields(setFormData);

  // Same source as the form validation, so the picker never offers a day the
  // validator rejects (or hides one it would accept) in a foreign time zone.
  const today = todayInZone(formData.timeZone);
  const orderedWeekdays = getOrderedWeekdays(locale);
  const isRecurring = formData.eventType === "RECURRING";

  const supportedTimeZones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [
          "Asia/Taipei",
          "Asia/Tokyo",
          "Asia/Shanghai",
          "America/New_York",
          "Europe/London",
        ];
  const timeZoneOptions = supportedTimeZones.includes(formData.timeZone)
    ? supportedTimeZones
    : [formData.timeZone, ...supportedTimeZones];

  const hasTimeError = errors.has(ValidationError.StartTimeAfterEndTime);
  const hasStartDateInPastError = errors.has(ValidationError.StartDateInPast);
  const hasWeekdayError = errors.has(ValidationError.WeekdaysRequired);
  const VotingDeadlineErrorMessage = errors.has(
    ValidationError.DeadlineRequired,
  )
    ? t("createEvent.votingDeadline.errorRequired")
    : null;

  const toggleWeekday = (weekday: (typeof orderedWeekdays)[number]) => {
    setFormData((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter((item) => item !== weekday)
        : [...prev.weekdays, weekday],
    }));
  };

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

          <div className="space-y-2">
            {!isRecurring ? (
              <div className="space-y-2">
                <Label>{t("createEvent.configuration.candidateDates")}</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      value={formData.startDate}
                      onChange={handleStartDateChange}
                      placeholder={t("createEvent.configuration.selectDate")}
                      minDate={today}
                      ariaLabel={t(
                        "createEvent.configuration.candidateDatesStartAria",
                      )}
                    />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      value={formData.endDate}
                      onChange={handleEndDateChange}
                      placeholder={t("createEvent.configuration.selectDate")}
                      minDate={formData.startDate || today}
                      ariaLabel={t(
                        "createEvent.configuration.candidateDatesEndAria",
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t("createEvent.configuration.weekdays")}</Label>
                <div className="grid grid-cols-7 gap-1 sm:grid-cols-7">
                  {orderedWeekdays.map((weekday) => {
                    const isSelected = formData.weekdays.includes(weekday);

                    return (
                      <Button
                        key={weekday}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "h-8",
                          !isSelected && "text-muted-foreground",
                        )}
                        onClick={() => toggleWeekday(weekday)}
                      >
                        {formatWeekdayLabel(
                          weekday,
                          locale,
                          locale.startsWith("zh") ? "narrow" : "short",
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("createEvent.configuration.dailyTimeWindow")}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <TimePicker
                    value={formData.startTime}
                    onChange={handleStartTimeChange}
                    type="start"
                    hasError={hasTimeError}
                    ariaLabel={t(
                      "createEvent.configuration.dailyTimeWindowStartAria",
                    )}
                  />
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <TimePicker
                    value={formData.endTime}
                    onChange={handleEndTimeChange}
                    type="end"
                    hasError={hasTimeError}
                    ariaLabel={t(
                      "createEvent.configuration.dailyTimeWindowEndAria",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time Zone */}
          <div className="space-y-1.5">
            <Label>{t("createEvent.configuration.timeZone")}</Label>
            <Select
              value={formData.timeZone}
              onValueChange={handleTimeZoneChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeZoneOptions.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voting Deadline */}
          <VotingDeadlineFields
            enabled={formData.votingDeadlineEnabled}
            date={formData.votingDeadline}
            time={formData.votingDeadlineTime}
            enableLabel={t("createEvent.votingDeadline.enable")}
            dateLabel={t("createEvent.votingDeadline.date")}
            timeLabel={t("createEvent.votingDeadline.time")}
            datePlaceholder={t("createEvent.configuration.selectDate")}
            timePlaceholder={t("createEvent.configuration.selectTime")}
            errorMessage={VotingDeadlineErrorMessage}
            onEnabledChange={handleVotingDeadlineEnabledChange}
            onDateChange={handleVotingDeadlineDateChange}
            onTimeChange={handleVotingDeadlineTimeChange}
          />

          {/* Time Error Message */}
          {hasTimeError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.configuration.timeError")}
              </p>
            </div>
          )}

          {/* Start Date In Past Error */}
          {hasStartDateInPastError && !isRecurring && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.configuration.startDateInPastError")}
              </p>
            </div>
          )}

          {hasWeekdayError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.configuration.weekdaysError")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
