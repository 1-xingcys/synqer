import { formatLocalizedRangeLabel } from "@/lib/event/event-time";
import { type HostedEventResultSummary } from "@/lib/event/hostedEventResultSummary";
import { getLiff, getLiffId } from "@/lib/line/liff";
import { eventDetailPath } from "@/lib/routing/eventRoutes";
import { ShareResult } from "./shareEventFlexMessage";

type HostedEventResultFlexMessageInfo = {
  eventId: string;
  eventTitle: string;
  summary: HostedEventResultSummary;
  locale: string;
};

export type HostedEventResultFlexCopy = {
  titlePrefix: string;
  untitledEvent: string;
  unavailableLabel: string;
  notVotedLabel: string;
  hiddenResultsLabel: (count: number) => string;
  viewResultsLabel: string;
};

const MAX_FLEX_MESSAGE_BYTES = 28 * 1024;

/**
 * Exported so the in-app preview renders the same words LINE receives. The
 * preview replicates the bubble's layout by hand; sharing the copy and the
 * palette below is what keeps the two from saying different things.
 */
export function getHostedEventResultFlexCopy(
  locale: string,
): HostedEventResultFlexCopy {
  if (locale === "zh-TW") {
    return {
      titlePrefix: "已確認結果",
      untitledEvent: "未命名活動",
      unavailableLabel: "不能出席",
      notVotedLabel: "未投票",
      hiddenResultsLabel: (count) => `另有 ${count} 個時段未顯示`,
      viewResultsLabel: "查看結果",
    };
  }

  return {
    titlePrefix: "Confirmed result",
    untitledEvent: "Untitled Event",
    unavailableLabel: "Unavailable",
    notVotedLabel: "Not voted",
    hiddenResultsLabel: (count) => `${count} more confirmed slots`,
    viewResultsLabel: "View results",
  };
}

function getLocalePrefix(locale: string) {
  return locale === "zh-TW" ? "/zh-TW" : "/en";
}

function buildEventResultUrl(eventId: string, locale: string): string {
  const resultPath = `${getLocalePrefix(locale)}${eventDetailPath(eventId, "results")}`;
  const liffId = getLiffId();

  if (!liffId && typeof window !== "undefined") {
    return `${window.location.origin}${resultPath}`;
  }

  if (!liffId) {
    return resultPath;
  }

  return new URL(`https://liff.line.me/${liffId}${resultPath}`).toString();
}

export function getAttendanceTextColor(
  availableCount: number,
  totalExpected: number,
) {
  if (totalExpected <= 0) return "#6B7280";

  const percentage = (availableCount / totalExpected) * 100;
  if (percentage >= 80) return "#3F7A57";
  if (percentage >= 50) return "#A77732";
  return "#B96868";
}

export function getAttendanceBarColors(
  availableCount: number,
  totalExpected: number,
): { fill: string; track: string } {
  if (totalExpected <= 0) return { fill: "#D1D5DB", track: "#F3F4F6" };

  const percentage = (availableCount / totalExpected) * 100;
  if (percentage >= 80) return { fill: "#A7D7B5", track: "#E8F4EC" };
  if (percentage >= 50) return { fill: "#E8C48D", track: "#FAF1E2" };
  return { fill: "#E6B0B0", track: "#F8EAEA" };
}

function getJsonByteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function buildNamesRow(label: string, labelColor: string, names: string[]) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      {
        type: "text",
        text: label,
        size: "xs",
        color: labelColor,
        weight: "bold",
        flex: 0,
      },
      {
        type: "text",
        text: names.join("、"),
        size: "xs",
        color: "#4B5563",
        wrap: true,
        flex: 1,
      },
    ],
  };
}

function buildRangeSection(params: {
  range: HostedEventResultSummary["ranges"][number];
  totalExpected: number;
  locale: string;
  copy: HostedEventResultFlexCopy;
}) {
  const slotLabel = formatLocalizedRangeLabel(
    {
      ...params.range.axis,
      startMinute: params.range.startMinute,
      endMinute: params.range.endMinute,
    },
    params.locale,
  );
  const unavailableNames = params.range.unavailableParticipants.map(
    (participant) => participant.name,
  );
  const barColors = getAttendanceBarColors(
    params.range.availableCount,
    params.totalExpected,
  );
  const percentage =
    params.totalExpected <= 0
      ? 0
      : Math.round((params.range.availableCount / params.totalExpected) * 100);
  const barWidth = percentage <= 0 ? "0%" : `${Math.max(6, percentage)}%`;

  return {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    margin: "lg",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: slotLabel,
            size: "sm",
            weight: "bold",
            wrap: true,
            color: "#374151",
            flex: 1,
          },
          {
            type: "text",
            text: `${params.range.availableCount}/${params.totalExpected}`,
            size: "xs",
            color: getAttendanceTextColor(
              params.range.availableCount,
              params.totalExpected,
            ),
            weight: "bold",
            align: "end",
            flex: 0,
          },
        ],
      },
      {
        type: "box",
        layout: "vertical",
        backgroundColor: barColors.track,
        cornerRadius: "999px",
        height: "4px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: barColors.fill,
            cornerRadius: "999px",
            width: barWidth,
            height: "4px",
            contents: [],
          },
        ],
      },
      ...(unavailableNames.length > 0
        ? [
            buildNamesRow(
              params.copy.unavailableLabel,
              "#6B7280",
              unavailableNames,
            ),
          ]
        : []),
    ],
  };
}

function buildFlexBubble(params: {
  title: string;
  viewResultsLabel: string;
  eventResultUrl: string;
  bodyContents: Array<Record<string, unknown>>;
}) {
  return {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "16px",
      contents: params.bodyContents,
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: params.viewResultsLabel,
            uri: params.eventResultUrl,
          },
          color: "#2563EB",
        },
      ],
      paddingAll: "0px",
    },
    styles: {
      footer: {
        separator: true,
      },
    },
  };
}

export function buildHostedEventResultFlexMessageFromSummary(
  info: HostedEventResultFlexMessageInfo,
) {
  const copy = getHostedEventResultFlexCopy(info.locale);
  const title = info.eventTitle || copy.untitledEvent;
  const eventResultUrl = buildEventResultUrl(info.eventId, info.locale);
  const baseBodyContents: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: copy.titlePrefix,
      size: "xs",
      color: "#6B7280",
      weight: "bold",
    },
    {
      type: "text",
      text: title,
      size: "xl",
      weight: "bold",
      wrap: true,
      maxLines: 2,
      color: "#111827",
    },
  ];

  const allRangeSections = info.summary.ranges.map((range) =>
    buildRangeSection({
      range,
      totalExpected: info.summary.totalExpected,
      locale: info.locale,
      copy,
    }),
  );

  // Kept at the bottom whichever ranges fit, so it counts toward the budget.
  const notVotedContents: Array<Record<string, unknown>> =
    info.summary.notVotedParticipants.length > 0
      ? [
          {
            ...buildNamesRow(
              copy.notVotedLabel,
              "#D97706",
              info.summary.notVotedParticipants.map((p) => p.name),
            ),
            margin: "xl",
          },
        ]
      : [];

  const visibleRangeSections: Array<Record<string, unknown>> = [];
  allRangeSections.forEach((section) => {
    const candidateBubble = buildFlexBubble({
      title,
      viewResultsLabel: copy.viewResultsLabel,
      eventResultUrl,
      bodyContents: [
        ...baseBodyContents,
        ...visibleRangeSections,
        section,
        ...notVotedContents,
      ],
    });
    const candidateMessage = {
      type: "flex",
      altText: `${copy.titlePrefix}｜${title}`,
      contents: candidateBubble,
    };

    if (getJsonByteLength(candidateMessage) <= MAX_FLEX_MESSAGE_BYTES) {
      visibleRangeSections.push(section);
    }
  });

  const hiddenRangeCount =
    allRangeSections.length - visibleRangeSections.length;
  const bodyContents = [...baseBodyContents, ...visibleRangeSections];

  if (hiddenRangeCount > 0) {
    const hiddenResultsText = {
      type: "text",
      text: copy.hiddenResultsLabel(hiddenRangeCount),
      size: "xs",
      color: "#6B7280",
      margin: "xl",
    };
    const candidateBubble = buildFlexBubble({
      title,
      viewResultsLabel: copy.viewResultsLabel,
      eventResultUrl,
      bodyContents: [...bodyContents, hiddenResultsText, ...notVotedContents],
    });
    const candidateMessage = {
      type: "flex",
      altText: `${copy.titlePrefix}｜${title}`,
      contents: candidateBubble,
    };

    if (getJsonByteLength(candidateMessage) <= MAX_FLEX_MESSAGE_BYTES) {
      bodyContents.push(hiddenResultsText);
    }
  }

  return {
    type: "flex",
    altText: `${copy.titlePrefix}｜${title}`,
    contents: buildFlexBubble({
      title,
      viewResultsLabel: copy.viewResultsLabel,
      eventResultUrl,
      bodyContents: [...bodyContents, ...notVotedContents],
    }),
  };
}

export async function shareHostedEventResultFlexMessage(
  info: HostedEventResultFlexMessageInfo,
): Promise<ShareResult> {
  const liff = await getLiff();
  if (!liff || !liff.isInClient()) {
    return ShareResult.Error;
  }

  try {
    const flexMessage = buildHostedEventResultFlexMessageFromSummary(info);
    const result = await liff.shareTargetPicker([
      flexMessage as Parameters<typeof liff.shareTargetPicker>[0][number],
    ]);

    if (result && result.status === "success") {
      return ShareResult.Success;
    }

    return ShareResult.Cancelled;
  } catch (error) {
    console.error("Failed to share hosted result flex message:", error);
    return ShareResult.Error;
  }
}
