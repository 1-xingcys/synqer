"use client";

import { useLocale, useTranslations } from "next-intl";
import { getVoteShareCopy } from "@/lib/line-flex-message/shareVoteCommitFlexMessage";

/**
 * What the notice looks like once it lands in the chat.
 *
 * The strings come from the flex message builder rather than from the message
 * catalog, so the preview cannot drift from what LINE actually receives. The
 * colors are hard-coded to the bubble's own palette instead of following the
 * app theme: a chat bubble stays light even when Synqer is in dark mode.
 */
export function VoteNoticeFlexPreview() {
  const locale = useLocale();
  const t = useTranslations("eventPreference.voteNotice");
  const copy = getVoteShareCopy(locale);

  return (
    <div
      className="mx-auto w-fit rounded-lg p-3 sm:p-5"
      style={{ backgroundColor: "#8698BF" }}
      role="img"
      aria-label={t("modal.previewAria")}
    >
      {/* A "deca" bubble is 260px wide. Phones get it at roughly 0.8x with the
          type scaled to match; from sm up it runs at the spec's own sizes. */}
      <div
        aria-hidden
        className="w-[13rem] overflow-hidden rounded-xl bg-white sm:w-[16rem] sm:rounded-2xl"
      >
        <div className="px-2.5 py-2.5 sm:px-3 sm:py-3">
          <p
            className="text-sm font-bold sm:text-base"
            style={{ color: "#1E3A8A" }}
          >
            {copy.votedText}
          </p>
          <p
            className="mt-0.5 text-xs sm:mt-1 sm:text-sm"
            style={{ color: "#374151" }}
          >
            {`${copy.eventPrefix}${t("modal.previewEventTitle")}`}
          </p>
        </div>
        <div
          className="grid grid-cols-2 border-t text-center text-xs sm:text-sm"
          style={{ borderColor: "#E5E7EB", color: "#2563EB" }}
        >
          <span className="py-2 sm:py-2.5">{copy.viewLabel}</span>
          <span className="py-2 sm:py-2.5">{copy.goVote}</span>
        </div>
      </div>
    </div>
  );
}
