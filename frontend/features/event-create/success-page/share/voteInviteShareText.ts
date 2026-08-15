import { buildEventShareBubbleFields } from "@/lib/line/line-flex-message";
import type { WallClock } from "@/lib/time";

function getInstruction(locale: string): string {
  return locale === "zh-TW"
    ? "請點選投票連結進行投票"
    : "Open the link below to vote";
}

export function buildVoteInviteShareText(opts: {
  eventTitle: string;
  shareUrl: string;
  locale: string;
  votingDeadline?: WallClock;
}): string {
  const { titleText, deadlineText } = buildEventShareBubbleFields({
    // Trimmed so a whitespace-only title falls back to the untitled label
    // rather than shipping a blank first line.
    title: opts.eventTitle.trim(),
    locale: opts.locale,
    votingDeadline: opts.votingDeadline,
  });

  const heading = deadlineText ? `${titleText}\n${deadlineText}` : titleText;

  // Empty blocks are dropped rather than joined through: an event with no
  // deadline, or a share URL that has not resolved yet, would otherwise land
  // in the message as a run of blank lines.
  return [heading, getInstruction(opts.locale), opts.shareUrl]
    .filter(Boolean)
    .join("\n\n");
}
