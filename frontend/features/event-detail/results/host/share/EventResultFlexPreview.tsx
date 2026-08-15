"use client";

import { useTranslations } from "next-intl";
import { formatLocalizedRangeLabel } from "@/lib/event/event-time";
import { type HostedEventResultSummary } from "@/lib/event/hostedEventResultSummary";
import {
  getAttendanceBarColors,
  getAttendanceTextColor,
  getHostedEventResultFlexCopy,
} from "@/lib/line/line-flex-message/hostedEventResultFlexMessage";

/**
 * What the confirmed result looks like once it lands in a LINE chat.
 *
 * The layout is a hand-built replica of the bubble in
 * `hostedEventResultFlexMessage.ts` rather than a render of its JSON, so
 * changing the bubble means changing this file too. The copy and the
 * attendance palette are imported from that module precisely because those
 * are the parts most likely to drift unnoticed.
 *
 * Two things the preview deliberately does not reproduce: the 28KB budget
 * that drops trailing ranges from the real message (every range is drawn
 * here), and the app theme — a chat bubble stays light even when Synqer is
 * in dark mode.
 *
 * This renders the bubble alone. The chat-coloured canvas behind it belongs
 * to the caller, so the preview and its frame stay one surface rather than a
 * card inside a card.
 */

/** Approximations of LINE's own type scale, at ~0.8x on phones. */
const TEXT_XS = "text-[10px] sm:text-[13px]";
const TEXT_SM = "text-[11px] sm:text-[14px]";
const TEXT_XL = "text-[18px] sm:text-[22px]";

interface EventResultFlexPreviewProps {
  eventTitle: string;
  summary: HostedEventResultSummary;
  locale: string;
}

export function EventResultFlexPreview({
  eventTitle,
  summary,
  locale,
}: EventResultFlexPreviewProps) {
  const t = useTranslations("eventInfo.sharePreview");
  const copy = getHostedEventResultFlexCopy(locale);
  const title = eventTitle || copy.untitledEvent;

  return (
    // A "mega" bubble is 300px wide; phones get it at roughly 0.8x.
    <div
      role="img"
      aria-label={t("flexAria")}
      className="w-[15rem] overflow-hidden rounded-xl bg-white sm:w-[18.75rem] sm:rounded-2xl"
    >
      <div aria-hidden>
        <div className="p-3 sm:p-4">
          <p className={`font-bold ${TEXT_XS}`} style={{ color: "#6B7280" }}>
            {copy.titlePrefix}
          </p>
          <p
            className={`mt-2 line-clamp-2 font-bold sm:mt-3 ${TEXT_XL}`}
            style={{ color: "#111827" }}
          >
            {title}
          </p>

          {summary.ranges.map((range, index) => (
            <RangeSection
              key={`${index}-${range.startMinute}`}
              range={range}
              totalExpected={summary.totalExpected}
              locale={locale}
              unavailableLabel={copy.unavailableLabel}
            />
          ))}
        </div>

        <div
          className={`border-t py-2 text-center sm:py-2.5 ${TEXT_SM}`}
          style={{ borderColor: "#E5E7EB", color: "#2563EB" }}
        >
          {copy.viewResultsLabel}
        </div>
      </div>
    </div>
  );
}

function RangeSection({
  range,
  totalExpected,
  locale,
  unavailableLabel,
}: {
  range: HostedEventResultSummary["ranges"][number];
  totalExpected: number;
  locale: string;
  unavailableLabel: string;
}) {
  const slotLabel = formatLocalizedRangeLabel(
    {
      ...range.axis,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
    },
    locale,
  );
  const unavailableNames = range.unavailableParticipants.map(
    (participant) => participant.name,
  );
  const barColors = getAttendanceBarColors(range.availableCount, totalExpected);
  const percentage =
    totalExpected <= 0
      ? 0
      : Math.round((range.availableCount / totalExpected) * 100);
  const barWidth = percentage <= 0 ? "0%" : `${Math.max(6, percentage)}%`;

  return (
    <div className="mt-3 sm:mt-4">
      <div className="flex items-center gap-2">
        <p
          className={`min-w-0 flex-1 font-bold ${TEXT_SM}`}
          style={{ color: "#374151" }}
        >
          {slotLabel}
        </p>
        <p
          className={`shrink-0 font-bold ${TEXT_XS}`}
          style={{
            color: getAttendanceTextColor(range.availableCount, totalExpected),
          }}
        >
          {`${range.availableCount}/${totalExpected}`}
        </p>
      </div>

      <div
        className="mt-1.5 h-1 rounded-full sm:mt-2"
        style={{ backgroundColor: barColors.track }}
      >
        <div
          className="h-1 rounded-full"
          style={{ width: barWidth, backgroundColor: barColors.fill }}
        />
      </div>

      {unavailableNames.length > 0 && (
        <div className={`mt-1.5 flex gap-2 sm:mt-2 ${TEXT_XS}`}>
          <span className="shrink-0 font-bold" style={{ color: "#6B7280" }}>
            {unavailableLabel}
          </span>
          <span className="min-w-0 break-words" style={{ color: "#4B5563" }}>
            {unavailableNames.join("、")}
          </span>
        </div>
      )}
    </div>
  );
}
