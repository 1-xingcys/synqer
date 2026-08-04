"use client";

import {
  CreateEventFormProvider,
  useFormStateContext,
} from "./CreateEventFormContext";
import { GeneralSection } from "./GeneralSection";
import { ConfigurationSection } from "./ConfigurationSection";
import { PreferenceSection } from "./PreferenceSection";
import { FormActions } from "./FormActions";
import { CancelConfirmModal } from "./CancelConfirmModal";

function CreateEventFormContent() {
  const {
    actions: { handleSubmit },
  } = useFormStateContext();

  return (
    <>
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
          <PreferenceSection />
        </div>

        <FormActions />
      </form>

      <CancelConfirmModal />
    </>
  );
}

export default function CreateEventForm() {
  return (
    <CreateEventFormProvider>
      <CreateEventFormContent />
    </CreateEventFormProvider>
  );
}
