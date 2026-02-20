import { getLiff } from "@/lib/liff";
import { ShareResult } from "./shareEventFlexMessage";

export interface VoteCommitShareInfo {
  eventId: string;
  eventTitle: string;
  voterUserId: string;
}

interface VoteShareCopy {
  votedText: string;
  viewLabel: string;
  untitledEvent: string;
  goVote: string;
  eventPrefix: string;
}

function getLocalePrefix(pathname: string): string {
  const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/);
  return localeMatch ? `/${localeMatch[1]}` : "";
}

function getVoteShareCopy(localePrefix: string): VoteShareCopy {
  if (localePrefix === "/zh-TW") {
    return {
      votedText: "已投票",
      viewLabel: "查看",
      untitledEvent: "未命名活動",
      goVote: "前往投票",
      eventPrefix: "活動：",
    };
  }

  return {
    votedText: "Voted",
    viewLabel: "View",
    untitledEvent: "Untitled Event",
    goVote: "Go Vote",
    eventPrefix: "Event: ",
  };
}

function buildVoteResultsUrl(info: VoteCommitShareInfo): string {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const localePrefix = getLocalePrefix(pathname);
  const resultsPath = `${localePrefix}/joined/${info.eventId}/results`;
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  if (!liffId && typeof window === "undefined") {
    return `${resultsPath}?selected=${encodeURIComponent(info.voterUserId)}`;
  }

  const baseUrl = liffId
    ? `https://liff.line.me/${liffId}${resultsPath}`
    : `${window.location.origin}${resultsPath}`;
  const url = new URL(baseUrl);
  url.searchParams.set("selected", info.voterUserId);
  return url.toString();
}

function buildGoVoteUrl(info: VoteCommitShareInfo): string {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const localePrefix = getLocalePrefix(pathname);
  const voteUrl = `${localePrefix}/events/${info.eventId}`;
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;

  if (!liffId && typeof window === "undefined") {
    return voteUrl;
  }

  const baseUrl = liffId
    ? `https://liff.line.me/${liffId}${voteUrl}`
    : `${window.location.origin}${voteUrl}`;

  return new URL(baseUrl).toString();
}

/**
 * 提供給 simulator / LINE 發送 API 的 Flex Message instance
 */
export function buildVoteCommitShareFlexMessage(info: VoteCommitShareInfo) {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const localePrefix = getLocalePrefix(pathname);
  const copy = getVoteShareCopy(localePrefix);
  const title = info.eventTitle || copy.untitledEvent;
  const resultsUrl = buildVoteResultsUrl(info);
  const goVoteUrl = buildGoVoteUrl(info);

  const flexMessage = {
    type: "flex",
    altText: `${copy.votedText}｜${title}`,
    contents: {
      type: "bubble",
      size: "deca",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: copy.votedText,
            weight: "bold",
            size: "md",
            color: "#1E3A8A",
          },
          {
            type: "text",
            text: `${copy.eventPrefix}${title}`,
            wrap: true,
            margin: "sm",
            size: "sm",
            color: "#374151",
            maxLines: 3,
          },
        ],
        paddingAll: "12px",
        spacing: "4px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: copy.viewLabel,
              uri: resultsUrl,
            },
            color: "#2563EB",
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: copy.goVote,
              uri: goVoteUrl,
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
    },
  };

  return {
    flexMessage,
    resultsUrl,
    goVoteUrl,
  };
}

export async function shareVoteCommitFlexMessage(
  info: VoteCommitShareInfo,
): Promise<ShareResult> {
  const liff = await getLiff();
  if (!liff || !liff.isInClient()) {
    return ShareResult.Error;
  }

  try {
    const { flexMessage } = buildVoteCommitShareFlexMessage(info);
    await liff.sendMessages([
      flexMessage as Parameters<typeof liff.sendMessages>[0][number],
    ]);
    return ShareResult.Success;
  } catch {
    return ShareResult.Error;
  }
}
