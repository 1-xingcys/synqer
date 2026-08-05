"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import {
  type HostedResultExpectedParticipant,
  type HostedResultVote,
} from "@/lib/hostedEventResultSummary";
import {
  useConfirmedHostedResultSlots,
  useHostedEventResultShare,
} from "./hooks";
import { EventResultShareModal } from "./EventResultShareModal";
import type { EventSlot } from "../types";

interface EventResultShareButtonProps {
  eventId: string;
  eventTitle: string;
  slots: EventSlot[];
  confirmedSlotIds?: string[];
  votes: HostedResultVote[];
  expectedParticipants: HostedResultExpectedParticipant[];
  hasStagedChanges: boolean;
}

export function EventResultShareButton({
  eventId,
  eventTitle,
  slots,
  confirmedSlotIds,
  votes,
  expectedParticipants,
  hasStagedChanges,
}: EventResultShareButtonProps) {
  const locale = useLocale();
  const t = useTranslations();
  const tEventInfo = useTranslations("eventInfo");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const confirmedSlots = useConfirmedHostedResultSlots({
    slots,
    confirmedSlotIds,
  });

  const {
    canShareResult,
    canNativeShareResultText,
    resultText,
    resultSummary,
    resultTextCopied,
    lineShareStatus,
    canShareResultToLine,
    handleShareResultText,
    handleShareResultToLine,
  } = useHostedEventResultShare({
    eventId,
    eventTitle,
    locale,
    confirmedSlots,
    votes,
    expectedParticipants,
    copy: {
      title: t("eventInfo.resultText.title"),
      eventLine: (eventTitle) =>
        t("eventInfo.resultText.event", { eventTitle }),
      availableLine: (availableCount, totalExpected) =>
        t("eventInfo.resultText.available", {
          availableCount,
          totalExpected,
        }),
      unavailableLine: (names) =>
        t("eventInfo.resultText.unavailable", { names }),
      none: t("eventInfo.resultText.none"),
    },
  });

  if (hasStagedChanges || !canShareResult) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
        title={tEventInfo("shareResult")}
      >
        <Share2 className="h-4 w-4 shrink-0" />
        {tEventInfo("shareResult")}
      </button>

      <EventResultShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventTitle={eventTitle}
        locale={locale}
        resultText={resultText}
        resultSummary={resultSummary}
        canNativeShareResultText={canNativeShareResultText}
        resultTextCopied={resultTextCopied}
        onShareResultText={handleShareResultText}
        showShareToLineOption={canShareResultToLine}
        lineShareStatus={lineShareStatus}
        onShareToLine={handleShareResultToLine}
      />
    </>
  );
}
