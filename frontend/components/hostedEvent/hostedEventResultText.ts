import { type HostedEventResultSummary } from "./resultSummary";
import { formatLocalizedDateMinuteRangeLabel } from "@/components/eventCommon/timeRangeFormat";

export type HostedEventResultTextCopy = {
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

function buildRangeLabel(
  range: HostedEventResultSummary["ranges"][number],
  locale: string,
) {
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

export function buildHostedEventResultTextFromSummary(opts: {
  eventTitle: string;
  summary: HostedEventResultSummary;
  locale: string;
  copy: HostedEventResultTextCopy;
}): string {
  const lines: string[] = [];
  lines.push(opts.copy.title);
  lines.push(opts.copy.eventLine(opts.eventTitle));
  lines.push(opts.copy.confirmedCountLine(opts.summary.ranges.length));
  lines.push("");

  opts.summary.ranges.forEach((range, index) => {
    const unavailableNames = range.unavailableParticipants.map(
      (participant) => participant.name,
    );
    const unavailable =
      unavailableNames.length > 0
        ? unavailableNames.join("、")
        : opts.copy.none;
    const percentage =
      opts.summary.totalExpected > 0
        ? `${Math.round((range.availableCount / opts.summary.totalExpected) * 1000) / 10}%`
        : "0%";

    lines.push(`${index + 1}. ${buildRangeLabel(range, opts.locale)}`);
    lines.push(
      opts.copy.availableLine(
        range.availableCount,
        opts.summary.totalExpected,
        percentage,
      ),
    );
    lines.push(opts.copy.unavailableLine(unavailable));
    lines.push("");
  });

  return lines.join("\n").trim();
}
