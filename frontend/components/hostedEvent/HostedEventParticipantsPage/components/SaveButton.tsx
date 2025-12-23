"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  saving: boolean;
  saveSuccess: boolean;
  onClick: () => void;
  className?: string;
}

export function SaveButton({
  saving,
  saveSuccess,
  onClick,
  className = "",
}: SaveButtonProps) {
  const t = useTranslations();

  return (
    <Button
      onClick={onClick}
      disabled={saving}
      className={`w-full ${className}`}
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("common.saving")}
        </>
      ) : saveSuccess ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          {t("event.saveSuccess")}
        </>
      ) : (
        t("hosted.participantsPage.saveParticipants")
      )}
    </Button>
  );
}
