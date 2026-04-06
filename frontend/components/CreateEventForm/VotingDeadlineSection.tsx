"use client";

import { useTranslations } from "next-intl";
import { VotingDeadlineFields } from "@/components/eventCommon/VotingDeadlineFields";
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

  const {
    handleVotingDeadlineEnabledChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
  } = useDateTimeFields(setFormData);

  const hasDeadlineRequiredError = errors.has(ValidationError.DeadlineRequired);
  const hasDeadlineAfterStartError = errors.has(
    ValidationError.DeadlineAfterStart,
  );
  const hasDeadlineInPastError = errors.has(ValidationError.DeadlineInPast);
  const isRecurring = formData.eventType === "RECURRING";

  const today = getToday();
  // Map shared validation results into create-page-specific copy and helper UI.
  const errorMessage = hasDeadlineRequiredError
    ? t("createEvent.votingDeadline.errorRequired")
    : hasDeadlineInPastError
      ? t("createEvent.votingDeadline.errorInPast")
      : hasDeadlineAfterStartError && !isRecurring
        ? t("createEvent.votingDeadline.errorAfterStart")
        : null;
  const helperText =
    !isRecurring && !formData.votingDeadlineManuallySet
      ? t("createEvent.votingDeadline.autoSync")
      : null;

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
          </div>

          <VotingDeadlineFields
            checkboxId="enable-voting-deadline"
            enabled={formData.votingDeadlineEnabled}
            date={formData.votingDeadline}
            time={formData.votingDeadlineTime}
            enableLabel={t("createEvent.votingDeadline.enable")}
            description={
              isRecurring
                ? t("createEvent.votingDeadline.recurringDescription")
                : t("createEvent.votingDeadline.description")
            }
            dateLabel={t("createEvent.votingDeadline.date")}
            timeLabel={t("createEvent.votingDeadline.time")}
            datePlaceholder={t("createEvent.configuration.selectDate")}
            minDate={today}
            maxDate={
              isRecurring ? undefined : (formData.startDate ?? undefined)
            }
            errorMessage={errorMessage}
            helperText={helperText}
            descriptionClassName="text-xs text-muted-foreground"
            onEnabledChange={handleVotingDeadlineEnabledChange}
            onDateChange={handleVotingDeadlineDateChange}
            onTimeChange={handleVotingDeadlineTimeChange}
          />
        </div>
      </div>
    </div>
  );
}
