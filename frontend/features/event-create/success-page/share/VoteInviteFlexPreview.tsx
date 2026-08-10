"use client";

import { useTranslations } from "next-intl";
import { buildEventShareBubbleFields } from "@/lib/line-flex-message";
import type { WallClock } from "@/lib/time";

/**
 * What the vote invite looks like once it lands in a LINE chat.
 *
 * The layout is a hand-built replica of the bubble in
 * `shareEventFlexMessage.ts`.
 */

/** Approximations of LINE's own type scale, at ~0.8x on phones. */
const TEXT_SM = "text-[11px] sm:text-[14px]";
const TEXT_LG = "text-[15px] sm:text-[19px]";

interface VoteInviteFlexPreviewProps {
  eventTitle: string;
  votingDeadline?: WallClock;
  locale: string;
}

export function VoteInviteFlexPreview({
  eventTitle,
  votingDeadline,
  locale,
}: VoteInviteFlexPreviewProps) {
  const t = useTranslations("createEvent.success.sharePreview");
  const fields = buildEventShareBubbleFields({
    title: eventTitle,
    votingDeadline,
    locale,
  });

  return (
    // A "kilo" bubble is 300px wide; phones get it at roughly 0.8x.
    <div
      role="img"
      aria-label={t("flexAria")}
      className="w-[15rem] overflow-hidden rounded-xl bg-white sm:w-[18.75rem] sm:rounded-2xl"
    >
      <div aria-hidden>
        <div className="px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <p
            className={`line-clamp-2 font-bold ${TEXT_LG}`}
            style={{ color: "#333333" }}
          >
            {fields.titleText}
          </p>

          {fields.deadlineText && (
            <p className={`mt-2 ${TEXT_SM}`} style={{ color: "#999999" }}>
              {fields.deadlineText}
            </p>
          )}

          <p
            className={`${fields.deadlineText ? "mt-3" : "mt-4"} ${TEXT_SM}`}
            style={{ color: "#666666" }}
          >
            {fields.instructionText}
          </p>
        </div>

        <div
          className={`border-t py-2 text-center font-medium sm:py-2.5 ${TEXT_SM}`}
          style={{ borderColor: "#E5E7EB", color: "#2563EB" }}
        >
          {fields.voteButtonLabel}
        </div>
      </div>
    </div>
  );
}
