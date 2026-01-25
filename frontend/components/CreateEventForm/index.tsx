"use client";

import { useTranslations } from "next-intl";
import { useCreateEventForm } from "./useCreateEventForm";
import { GeneralSection } from "./GeneralSection";
import { ConfigurationSection } from "./ConfigurationSection";
import { VotingDeadlineSection } from "./VotingDeadlineSection";
import { FormActions } from "./FormActions";

export default function CreateEventForm() {
  const t = useTranslations();
  const {
    formData,
    loading,
    validationErrors,
    updateTitle,
    updateDescription,
    handleStartDateChange,
    handleEndDateChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handleVotingDeadlineDateChange,
    handleVotingDeadlineTimeChange,
    handleLineGroupChange,
    handleSelectedMembersChange,
    handleSubmit,
    handleCancel,
    confirmCancel,
    cancelConfirmCancel,
    isFormValid,
    titleCharCount,
    descriptionCharCount,
    showCancelConfirm,
  } = useCreateEventForm();

  return (
    <div className="max-w-4xl mx-auto py-8 pr-4">
      {/* Header */}
      <div className="md:ml-6 lg:ml-18">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          {t("createEvent.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("createEvent.description")}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
        {/* Wrapper for sections with connecting line */}
        <div className="relative">
          {/* Connecting line from step 1 to last step */}
          <div
            className="absolute left-[0.8rem] lg:left-[2.3rem] w-0.5 bg-border"
            style={{
              top: "3rem",
              bottom: "1.5rem",
              zIndex: 1,
            }}
          />

          {/* Section 1: General (includes LINE Group Selection) */}
          <GeneralSection
            title={formData.title}
            description={formData.description}
            titleCharCount={titleCharCount}
            descriptionCharCount={descriptionCharCount}
            onTitleChange={updateTitle}
            onDescriptionChange={updateDescription}
            selectedLineGroupId={formData.lineGroupId}
            selectedLineUserIds={formData.selectedLineUserIds}
            onLineGroupChange={handleLineGroupChange}
            onLineMembersChange={handleSelectedMembersChange}
          />

          {/* Section 2: Configuration */}
          <ConfigurationSection
            startDate={formData.startDate}
            endDate={formData.endDate}
            startTime={formData.startTime}
            endTime={formData.endTime}
            hasTimeError={!!validationErrors.startTime}
            hasStartTimeTooSoonError={!!validationErrors.startDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
          />

          {/* Section 3: Voting Deadline */}
          <VotingDeadlineSection
            votingDeadline={formData.votingDeadline}
            votingDeadlineTime={formData.votingDeadlineTime}
            startDate={formData.startDate}
            startTime={formData.startTime}
            isManuallySet={formData.votingDeadlineManuallySet}
            hasError={!!validationErrors.votingDeadline}
            onDeadlineDateChange={handleVotingDeadlineDateChange}
            onDeadlineTimeChange={handleVotingDeadlineTimeChange}
          />
        </div>

        {/* Submit Button */}
        <FormActions
          loading={loading}
          isFormValid={isFormValid}
          showCancelConfirm={showCancelConfirm}
          onCancel={handleCancel}
          onConfirmCancel={confirmCancel}
          onCancelConfirmCancel={cancelConfirmCancel}
        />
      </form>
    </div>
  );
}
