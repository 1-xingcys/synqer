import { type HostedEventResultSummary } from "@/lib/event/hostedEventResultSummary";
import { formatLocalizedRangeLabel } from "@/lib/event/event-time";

export type HostedEventResultTextCopy = {
  title: string;
  eventLine: (eventTitle: string) => string;
  availableLine: (availableCount: number, totalExpected: number) => string;
  unavailableLine: (names: string) => string;
  notVotedLine: (names: string) => string;
  none: string;
};

function buildRangeLabel(
  range: HostedEventResultSummary["ranges"][number],
  locale: string,
) {
  return formatLocalizedRangeLabel(
    {
      ...range.axis,
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

  if (opts.summary.notVotedParticipants.length > 0) {
    lines.push(
      opts.copy.notVotedLine(
        opts.summary.notVotedParticipants.map((p) => p.name).join("、"),
      ),
    );
  }

  return lines.join("\n").trim();
}
