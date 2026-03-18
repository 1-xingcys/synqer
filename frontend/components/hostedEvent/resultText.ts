"use client";

import {
  buildHostedEventResultSummary,
  type HostedResultExpectedParticipant,
  type HostedResultSlot,
  type HostedResultSummaryRange,
  type HostedResultVote,
} from "./resultSummary";
import { formatLocalizedDateMinuteRangeLabel } from "@/components/eventCommon/timeRangeFormat";

type HostedResultTextCopy = {
  title: string;
  eventLine: (eventTitle: string) => string;
  confirmedCountLine: (count: number) => string;
  availableLine: (
    availableCount: number,
    totalExpected: number,
    percentage: string,
  ) => string;
  unavailableLine: (names: string) => string;
  none: string;
};

function buildRangeLabel(range: HostedResultSummaryRange, locale: string) {
  return formatLocalizedDateMinuteRangeLabel(
    {
      startDate: range.startDate,
      endDate: range.endDate,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
    },
    locale,
  );
}

export function buildHostedEventResultText(opts: {
  eventTitle: string;
  confirmedSlots: HostedResultSlot[];
  votes: HostedResultVote[];
  expectedParticipants: HostedResultExpectedParticipant[];
  locale: string;
  copy: HostedResultTextCopy;
}): string {
  const summary = buildHostedEventResultSummary({
    confirmedSlots: opts.confirmedSlots,
    votes: opts.votes,
    expectedParticipants: opts.expectedParticipants,
  });

  const lines: string[] = [];
  lines.push(opts.copy.title);
  lines.push(opts.copy.eventLine(opts.eventTitle));
  lines.push(opts.copy.confirmedCountLine(summary.ranges.length));
  lines.push("");

  summary.ranges.forEach((range, index) => {
    const unavailable =
      range.unavailableNames.length > 0
        ? range.unavailableNames.join("、")
        : opts.copy.none;
    const percentage =
      summary.totalExpected > 0
        ? `${Math.round((range.availableCount / summary.totalExpected) * 1000) / 10}%`
        : "0%";

    lines.push(`${index + 1}. ${buildRangeLabel(range, opts.locale)}`);
    lines.push(
      opts.copy.availableLine(
        range.availableCount,
        summary.totalExpected,
        percentage,
      ),
    );
    lines.push(opts.copy.unavailableLine(unavailable));
    lines.push("");
  });

  return lines.join("\n").trim();
}
