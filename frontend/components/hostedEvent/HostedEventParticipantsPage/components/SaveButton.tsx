"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
          <Spinner size="sm" className="mr-2" />
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
