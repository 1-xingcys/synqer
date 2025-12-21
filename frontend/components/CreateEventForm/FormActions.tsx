"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  loading: boolean;
  isFormValid: boolean;
  onCancel: () => void;
}

export function FormActions({
  loading,
  isFormValid,
  onCancel,
}: FormActionsProps) {
  const t = useTranslations();

  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-border">
      <Button type="button" variant="outline" onClick={onCancel}>
        {t("createEvent.cancel")}
      </Button>
      <Button type="submit" disabled={loading || !isFormValid}>
        {loading ? t("createEvent.creating") : t("createEvent.create")}
      </Button>
    </div>
  );
}
