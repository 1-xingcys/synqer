import { type HostedEventResultSummary } from "./resultSummary";
import { formatLocalizedRangeLabel } from "@/components/eventCommon/timeRangeFormat";

export type HostedEventResultTextCopy = {
  title: string;
  eventLine: (eventTitle: string) => string;
  availableLine: (availableCount: number, totalExpected: number) => string;
  unavailableLine: (names: string) => string;
  none: string;
};

function buildRangeLabel(
  range: HostedEventResultSummary["ranges"][number],
  locale: string,
) {
  return formatLocalizedRangeLabel(
    {
      axisType: range.axisType,
      startDate: range.startDate,
      endDate: range.endDate,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
    },
    locale,
  );
}

export function buildHostedEventResultTextFromSummary(opts: {
  eventTitle: string;
  summary: HostedEventResultSummary;
  locale: string;
  copy: HostedEventResultTextCopy;
}): string {
  const lines: string[] = [];
  lines.push(opts.copy.title);
  lines.push(opts.copy.eventLine(opts.eventTitle));
  lines.push("");

  opts.summary.ranges.forEach((range, index) => {
    const unavailableNames = range.unavailableParticipants.map(
      (participant) => participant.name,
    );
    const unavailable =
      unavailableNames.length > 0
        ? unavailableNames.join("、")
        : opts.copy.none;

    lines.push(`${index + 1}. ${buildRangeLabel(range, opts.locale)}`);
    lines.push(
      opts.copy.availableLine(range.availableCount, opts.summary.totalExpected),
    );
    lines.push(opts.copy.unavailableLine(unavailable));
    lines.push("");
  });

  return lines.join("\n").trim();
}
