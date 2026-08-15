"use client";

import { useMemo, useRef, useState } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useLiffContext } from "@/contexts/LiffContext";
import {
  buildHostedEventResultTextFromSummary,
  type HostedEventResultTextCopy,
} from "../hostedEventResultText";
import {
  buildHostedEventResultSummary,
  type HostedResultExpectedParticipant,
  type HostedResultSlot,
  type HostedResultVote,
} from "@/lib/event/hostedEventResultSummary";
import {
  canShareText,
  shareText,
  TextShareResult,
} from "@/lib/share/shareText";
import { shareHostedEventResultFlexMessage } from "@/lib/line/line-flex-message/hostedEventResultFlexMessage";
import { ShareResult } from "@/lib/line/line-flex-message/shareEventFlexMessage";

const LineShareStatus = {
  Idle: "idle",
  Sending: "sending",
  Success: "success",
  Error: "error",
} as const;

type LineShareStatus = (typeof LineShareStatus)[keyof typeof LineShareStatus];

export function useHostedEventResultShare(opts: {
  eventId: string;
  eventTitle: string;
  locale: string;
  confirmedSlots: HostedResultSlot[];
  votes: HostedResultVote[];
  expectedParticipants: HostedResultExpectedParticipant[];
  copy: HostedEventResultTextCopy;
}) {
  const { copied: resultTextCopied, copy: copyResultText } =
    useCopyToClipboard();
  const { isInClient: isInLiffClient, isInitialized: isLiffInitialized } =
    useLiffContext();
  const canNativeShareResultText = canShareText();
  // The native share sheet is modal and reports its own progress, so this only
  // needs to stop a second call while one is open. A ref, not state: nothing
  // renders it.
  const isSharingResultText = useRef(false);
  const [lineShareStatus, setLineShareStatus] = useState<LineShareStatus>(
    LineShareStatus.Idle,
  );

  const resultSummary = useMemo(() => {
    if (opts.confirmedSlots.length === 0) {
      return null;
    }

    return buildHostedEventResultSummary({
      confirmedSlots: opts.confirmedSlots,
      votes: opts.votes,
      expectedParticipants: opts.expectedParticipants,
    });
  }, [opts.confirmedSlots, opts.expectedParticipants, opts.votes]);

  const canShareResult = Boolean(resultSummary?.ranges.length);

  const canShareResultToLine =
    canShareResult && isInLiffClient && isLiffInitialized;

  // Built up front rather than inside the handler: the share modal previews
  // the very same string it is about to send.
  const resultText = resultSummary
    ? buildHostedEventResultTextFromSummary({
        eventTitle: opts.eventTitle,
        summary: resultSummary,
        locale: opts.locale,
        copy: opts.copy,
      })
    : "";

  const handleShareResultText = async () => {
    if (!resultText) return false;

    if (!canNativeShareResultText) {
      return await copyResultText(resultText);
    }

    if (isSharingResultText.current) return false;
    isSharingResultText.current = true;

    try {
      const result = await shareText({ text: resultText });
      return result === TextShareResult.Success;
    } finally {
      isSharingResultText.current = false;
    }
  };

  const handleShareResultToLine = async () => {
    if (!resultSummary || !canShareResultToLine) {
      return false;
    }

    setLineShareStatus(LineShareStatus.Sending);

    const result = await shareHostedEventResultFlexMessage({
      eventId: opts.eventId,
      eventTitle: opts.eventTitle,
      summary: resultSummary,
      locale: opts.locale,
    });

    if (result === ShareResult.Success) {
      setLineShareStatus(LineShareStatus.Success);
      return true;
    }

    if (result === ShareResult.Cancelled) {
      setLineShareStatus(LineShareStatus.Idle);
      return false;
    }

    setLineShareStatus(LineShareStatus.Error);
    return false;
  };

  return {
    canShareResult,
    canNativeShareResultText,
    resultText,
    resultSummary,
    resultTextCopied,
    lineShareStatus,
    canShareResultToLine,
    handleShareResultText,
    handleShareResultToLine,
  };
}
