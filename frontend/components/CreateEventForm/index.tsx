"use client";

import { useTranslations } from "next-intl";
import { useCreateEventForm } from "./useCreateEventForm";
import { GeneralSection } from "./GeneralSection";
import { ConfigurationSection } from "./ConfigurationSection";
import { FormActions } from "./FormActions";

export default function CreateEventForm() {
  const t = useTranslations();
  const {
    formData,
    loading,
    updateField,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
    handleCancel,
    isFormValid,
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
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {t("createEvent.requiredNote")}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
        {/* Wrapper for sections with connecting line */}
        <div className="relative">
          {/* Connecting line from step 1 bottom to Configuration section bottom */}
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
            onTitleChange={(value) => updateField("title", value)}
            onDescriptionChange={(value) => updateField("description", value)}
          />

          {/* Section 2: Configuration */}
          <ConfigurationSection
            startDate={formData.startDate}
            endDate={formData.endDate}
            startTime={formData.startTime}
            endTime={formData.endTime}
            slotDurationMin={formData.slotDurationMin}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onStartTimeChange={(value) => updateField("startTime", value)}
            onEndTimeChange={(value) => updateField("endTime", value)}
            onSlotDurationChange={(value) =>
              updateField("slotDurationMin", value)
            }
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
