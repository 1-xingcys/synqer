"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useMinuteNow } from "@/hooks/useMinuteNow";
import { useFormStateContext } from "./CreateEventFormContext";
import { useFormValidation } from "./hooks/useFormValidation";

export function FormActions() {
  const t = useTranslations();

  const {
    state: { formData, loading },
    actions: { handleCancel },
  } = useFormStateContext();
  const now = useMinuteNow();
  const { errors } = useFormValidation(formData, now);

  return (
    <>
      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={handleCancel}>
          {t("createEvent.cancel")}
        </Button>
        <Button type="submit" disabled={loading || errors.size > 0}>
          {loading ? t("createEvent.creating") : t("createEvent.create")}
        </Button>
      </div>
    </>
  );
}
