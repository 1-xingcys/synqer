"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFormStateContext } from "./CreateEventFormContext";

export function FormActions() {
  const t = useTranslations();

  const {
    state: { loading },
    validation: { errors },
    actions: { handleCancel },
  } = useFormStateContext();

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
