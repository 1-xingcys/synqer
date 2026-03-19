"use client";

import { useState } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useLiff } from "@/hooks/useLiff";
import {
  buildHostedEventResultTextFromSummary,
  type HostedEventResultTextCopy,
} from "@/components/hostedEvent/hostedEventResultText";
import { type HostedEventResultSummary } from "@/components/hostedEvent/resultSummary";
import { shareHostedEventResultFlexMessage } from "@/lib/line-flex-message/hostedEventResultFlexMessage";
import { ShareResult } from "@/lib/line-flex-message/shareEventFlexMessage";

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
  resultSummary: HostedEventResultSummary | null;
  locale: string;
  copy: HostedEventResultTextCopy;
}) {
  const { copied: resultTextCopied, copy: copyResultText } =
    useCopyToClipboard();
  const { isInClient: isInLiffClient, isInitialized: isLiffInitialized } =
    useLiff();
  const [lineShareStatus, setLineShareStatus] = useState<LineShareStatus>(
    LineShareStatus.Idle,
  );

  const canShareResultToLine =
    Boolean(opts.resultSummary?.ranges.length) &&
    isInLiffClient &&
    isLiffInitialized;

  const buildResultText = () => {
    if (!opts.resultSummary) return "";

    return buildHostedEventResultTextFromSummary({
      eventTitle: opts.eventTitle,
      summary: opts.resultSummary,
      locale: opts.locale,
      copy: opts.copy,
    });
  };

  const handleCopyResultText = () => {
    const resultText = buildResultText();
    if (!resultText) return Promise.resolve();
    return copyResultText(resultText);
  };

  const handleShareResultToLine = async () => {
    if (!opts.resultSummary || !canShareResultToLine) {
      return false;
    }

    setLineShareStatus(LineShareStatus.Sending);

    const result = await shareHostedEventResultFlexMessage({
      eventId: opts.eventId,
      eventTitle: opts.eventTitle,
      summary: opts.resultSummary,
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
    resultTextCopied,
    lineShareStatus,
    canShareResultToLine,
    handleCopyResultText,
    handleShareResultToLine,
  };
}
