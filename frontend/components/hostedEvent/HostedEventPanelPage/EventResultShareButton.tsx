"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import {
  type HostedResultExpectedParticipant,
  type HostedResultVote,
} from "@/components/hostedEvent/resultSummary";
import { type EventSlotAxisType, type Weekday } from "@/types/event";
import {
  useConfirmedHostedResultSlots,
  useHostedEventResultShare,
} from "./hooks";
import { EventResultShareModal } from "./EventResultShareModal";

interface EventSlot {
  id: string;
  axisType: EventSlotAxisType;
  axisDate?: string | Date | null;
  axisWeekday?: Weekday | null;
  startMinute: number;
  endMinute: number;
}

interface EventResultShareButtonProps {
  eventId: string;
  eventTitle: string;
  slots: EventSlot[];
  confirmedSlotIds?: string[];
  votes: HostedResultVote[];
  expectedParticipants: HostedResultExpectedParticipant[];
}

export function EventResultShareButton({
  eventId,
  eventTitle,
  slots,
  confirmedSlotIds,
  votes,
  expectedParticipants,
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
    resultTextShareStatus,
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

  if (!canShareResult) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/35"
        title={tEventInfo("shareResult")}
        aria-label={tEventInfo("shareResult")}
      >
        <Share2 className="h-4 w-4" />
      </button>

      <EventResultShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        canNativeShareResultText={canNativeShareResultText}
        resultTextShareStatus={resultTextShareStatus}
        resultTextCopied={resultTextCopied}
        onShareResultText={handleShareResultText}
        showShareToLineOption={canShareResultToLine}
        lineShareStatus={lineShareStatus}
        onShareToLine={handleShareResultToLine}
      />
    </>
  );
}
