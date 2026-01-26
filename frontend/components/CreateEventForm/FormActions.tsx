"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFormStateContext } from "./CreateEventFormContext";
import { useFormValidation } from "./hooks/useFormValidation";
import { useFormActions } from "./hooks/useFormActions";

export function FormActions() {
  const t = useTranslations();

  const {
    formData,
    loading,
    setLoading,
    showCancelConfirm,
    setShowCancelConfirm,
  } = useFormStateContext();

  const { errors, hasUnsavedChanges } = useFormValidation(formData);

  const { handleCancel, confirmCancel, cancelConfirmCancel } = useFormActions({
    formData,
    hasUnsavedChanges,
    setLoading,
    setShowCancelConfirm,
  });

  return (
    <>
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={cancelConfirmCancel}
          />

          {/* Modal */}
          <div className="relative bg-background border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("createEvent.cancelConfirm.title")}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("createEvent.cancelConfirm.description")}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={cancelConfirmCancel}>
                {t("createEvent.cancelConfirm.keepEditing")}
              </Button>
              <Button variant="destructive" onClick={confirmCancel}>
                {t("createEvent.cancelConfirm.discard")}
              </Button>
            </div>
          </div>
        </div>
      )}

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
