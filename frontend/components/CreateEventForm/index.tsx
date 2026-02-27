"use client";

import { useTranslations } from "next-intl";
import {
  CreateEventFormProvider,
  useFormStateContext,
} from "./CreateEventFormContext";
import { GeneralSection } from "./GeneralSection";
import { ConfigurationSection } from "./ConfigurationSection";
import { VotingDeadlineSection } from "./VotingDeadlineSection";
import { FormActions } from "./FormActions";
import { CancelConfirmModal } from "./CancelConfirmModal";

function CreateEventFormContent() {
  const t = useTranslations();

  const {
    actions: { handleSubmit },
  } = useFormStateContext();

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
            className="absolute left-[0.8rem] lg:left-[2.3rem] w-0.5 bg-border z-[1]"
            style={{
              top: "3rem",
              bottom: "1.5rem",
            }}
          />
          <GeneralSection />
          <ConfigurationSection />
          <VotingDeadlineSection />
        </div>

        <FormActions />
      </form>

      <CancelConfirmModal />
    </div>
  );
}

export default function CreateEventForm() {
  return (
    <CreateEventFormProvider>
      <CreateEventFormContent />
    </CreateEventFormProvider>
  );
}
