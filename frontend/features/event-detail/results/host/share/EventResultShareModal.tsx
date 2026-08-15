"use client";

import { useTranslations } from "next-intl";
import { ShareSheet } from "@/components/ui/ShareSheet";
import { type HostedEventResultSummary } from "@/lib/event/hostedEventResultSummary";
import { EventResultShareContent } from "./EventResultShareContent";

interface EventResultShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  locale: string;
  resultText: string;
  resultSummary: HostedEventResultSummary | null;
  canNativeShareResultText: boolean;
  resultTextCopied: boolean;
  onShareResultText: () => Promise<boolean> | boolean;
  showShareToLineOption: boolean;
  lineShareStatus: "idle" | "sending" | "success" | "error";
  onShareToLine: () => Promise<boolean> | boolean;
}

export function EventResultShareModal({
  isOpen,
  onClose,
  ...content
}: EventResultShareModalProps) {
  const tCommon = useTranslations("common");
  const tEventInfo = useTranslations("eventInfo");

  return (
    <ShareSheet
      isOpen={isOpen}
      onClose={onClose}
      title={tEventInfo("shareResultTitle")}
      closeLabel={tCommon("close")}
    >
      <EventResultShareContent onClose={onClose} {...content} />
    </ShareSheet>
  );
}
