"use client";

import { useTranslations } from "next-intl";
import { useCreateEventForm } from "./useCreateEventForm";
import { GeneralSection } from "./GeneralSection";
import { LineGroupSection } from "./LineGroupSection";
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
    isFormValid,
    titleCharCount,
    descriptionCharCount,
  } = useCreateEventForm();

  return (
    <div className="max-w-4xl mx-auto py-8 pr-4">
      {/* Header */}
      <div className="md:ml-6 lg:ml-18">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-1">
          {t("createEvent.title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {t("createEvent.description")}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
        {/* Wrapper for sections with connecting line */}
        <div className="relative">
          {/* Connecting line from step 1 to last step */}
          <div
            className="absolute left-[0.8rem] lg:left-[2.3rem] w-0.5 bg-gray-300 dark:bg-zinc-600"
            style={{
              top: "3rem",
              bottom: "1.5rem",
              zIndex: 1,
            }}
          />

          {/* Section 1: General */}
          <GeneralSection
            title={formData.title}
            description={formData.description}
            titleCharCount={titleCharCount}
            descriptionCharCount={descriptionCharCount}
            onTitleChange={updateTitle}
            onDescriptionChange={updateDescription}
          />

          {/* LINE Group Selection (only for LINE users) */}
          <div className="rounded-lg py-2 lg:px-6 bg-white dark:bg-zinc-900 relative">
            <div className="flex items-start gap-6">
              {/* Empty space for alignment */}
              <div className="shrink-0 w-7" />
              {/* Content */}
              <div className="flex-1">
                <LineGroupSection
                  selectedGroupId={formData.lineGroupId}
                  selectedMemberIds={formData.selectedLineUserIds}
                  onGroupChange={handleLineGroupChange}
                  onMembersChange={handleSelectedMembersChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Configuration */}
          <ConfigurationSection
            startDate={formData.startDate}
            endDate={formData.endDate}
            startTime={formData.startTime}
            endTime={formData.endTime}
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
          onCancel={handleCancel}
        />
      </form>
    </div>
  );
}
