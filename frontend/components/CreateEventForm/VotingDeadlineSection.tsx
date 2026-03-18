"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";
import { useFormStateContext } from "./CreateEventFormContext";
import { useDateTimeFields } from "./hooks/useDateTimeFields";
import { ValidationError } from "./hooks/useFormValidation";
import { getToday } from "./hooks/utils";

export function VotingDeadlineSection() {
  const t = useTranslations();

  const {
    state: { formData, setFormData },
    validation: { errors },
  } = useFormStateContext();

  const { handleVotingDeadlineDateChange, handleVotingDeadlineTimeChange } =
    useDateTimeFields(setFormData);

  const hasDeadlineAfterStartError = errors.has(
    ValidationError.DeadlineAfterStart,
  );
  const hasDeadlineInPastError = errors.has(ValidationError.DeadlineInPast);
  const isRecurring = formData.eventType === "RECURRING";

  const today = getToday();

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
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t("createEvent.votingDeadline.description")}
              </p>
              {isRecurring && formData.votingDeadline && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      votingDeadline: null,
                    }))
                  }
                >
                  {t("createEvent.votingDeadline.clear")}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("createEvent.votingDeadline.date")}</Label>
              <DatePicker
                value={formData.votingDeadline}
                onChange={handleVotingDeadlineDateChange}
                placeholder={t("createEvent.configuration.selectDate")}
                minDate={today}
                maxDate={
                  isRecurring ? undefined : (formData.startDate ?? undefined)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("createEvent.votingDeadline.time")}</Label>
              <TimePicker
                value={formData.votingDeadlineTime}
                onChange={handleVotingDeadlineTimeChange}
                type="start"
              />
            </div>
          </div>

          {/* Auto-sync indicator */}
          {!isRecurring && !formData.votingDeadlineManuallySet && (
            <p className="text-xs text-primary flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              {t("createEvent.votingDeadline.autoSync")}
            </p>
          )}

          {/* Error messages */}
          {hasDeadlineInPastError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.votingDeadline.errorInPast")}
              </p>
            </div>
          )}
          {hasDeadlineAfterStartError && !isRecurring && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                {t("createEvent.votingDeadline.errorAfterStart")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
