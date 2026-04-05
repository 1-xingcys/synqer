"use client";

import { useMemo, useState } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useLiff } from "@/hooks/useLiff";
import {
  buildHostedEventResultTextFromSummary,
  type HostedEventResultTextCopy,
} from "@/components/hostedEvent/hostedEventResultText";
import {
  buildHostedEventResultSummary,
  type HostedResultExpectedParticipant,
  type HostedResultSlot,
  type HostedResultVote,
} from "@/components/hostedEvent/resultSummary";
import {
  canShareHostedEventResultText,
  shareHostedEventResultText,
  TextShareResult,
} from "@/components/hostedEvent/shareHostedEventResultText";
import { shareHostedEventResultFlexMessage } from "@/lib/line-flex-message/hostedEventResultFlexMessage";
import { ShareResult } from "@/lib/line-flex-message/shareEventFlexMessage";

const LineShareStatus = {
  Idle: "idle",
  Sending: "sending",
  Success: "success",
  Error: "error",
} as const;

type LineShareStatus = (typeof LineShareStatus)[keyof typeof LineShareStatus];

const ResultTextShareStatus = {
  Idle: "idle",
  Sending: "sending",
  Success: "success",
  Error: "error",
} as const;

type ResultTextShareStatus =
  (typeof ResultTextShareStatus)[keyof typeof ResultTextShareStatus];

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
    useLiff();
  const canNativeShareResultText = canShareHostedEventResultText();
  const [resultTextShareStatus, setResultTextShareStatus] =
    useState<ResultTextShareStatus>(ResultTextShareStatus.Idle);
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

  const buildResultText = () => {
    if (!resultSummary) return "";

    return buildHostedEventResultTextFromSummary({
      eventTitle: opts.eventTitle,
      summary: resultSummary,
      locale: opts.locale,
      copy: opts.copy,
    });
  };

  const handleShareResultText = async () => {
    const resultText = buildResultText();
    if (!resultText) return false;

    if (!canNativeShareResultText) {
      const copied = await copyResultText(resultText);
      setResultTextShareStatus(
        copied ? ResultTextShareStatus.Success : ResultTextShareStatus.Error,
      );
      return copied;
    }

    setResultTextShareStatus(ResultTextShareStatus.Sending);

    const result = await shareHostedEventResultText({
      text: resultText,
    });

    if (result === TextShareResult.Success) {
      setResultTextShareStatus(ResultTextShareStatus.Success);
      return true;
    }

    if (result === TextShareResult.Cancelled) {
      setResultTextShareStatus(ResultTextShareStatus.Idle);
      return false;
    }

    setResultTextShareStatus(ResultTextShareStatus.Error);
    return false;
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
    resultTextShareStatus,
    resultTextCopied,
    lineShareStatus,
    canShareResultToLine,
    handleShareResultText,
    handleShareResultToLine,
  };
}
