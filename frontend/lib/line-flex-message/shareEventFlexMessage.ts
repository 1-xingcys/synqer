import { getLiff } from "@/lib/liff";

export interface EventShareInfo {
  eventId: string;
  title: string;
  hostName: string;
  hostAvatarUrl?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  votingDeadline?: string; // ISO string
}

export const ShareResult = {
  Success: "success",
  Cancelled: "cancelled",
  Error: "error",
} as const;
export type ShareResult = (typeof ShareResult)[keyof typeof ShareResult];

interface EventShareCopy {
  votePrefix: string;
  untitledEvent: string;
  deadlinePrefix: string;
  instructionText: string;
  voteButtonLabel: string;
  weekdays: string[];
  openingParenthesis: string;
  closingParenthesis: string;
}

function getLocalePrefix(pathname: string): string {
  const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/);
  return localeMatch ? `/${localeMatch[1]}` : "";
}

function getEventShareCopy(localePrefix: string): EventShareCopy {
  if (localePrefix === "/zh-TW") {
    return {
      votePrefix: "[投票] ",
      untitledEvent: "未命名活動",
      deadlinePrefix: "截止：",
      instructionText: "請前往投票頁面中投票。",
      voteButtonLabel: "立即投票",
      weekdays: ["日", "一", "二", "三", "四", "五", "六"],
      openingParenthesis: "（",
      closingParenthesis: "）",
    };
  }

  return {
    votePrefix: "[Vote] ",
    untitledEvent: "Untitled Event",
    deadlinePrefix: "Deadline: ",
    instructionText: "Please open the voting page to vote.",
    voteButtonLabel: "Vote Now",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    openingParenthesis: "(",
    closingParenthesis: ")",
  };
}

function formatDeadline(
  votingDeadline: string | undefined,
  copy: EventShareCopy,
): string | null {
  if (!votingDeadline) return null;
  const d = new Date(votingDeadline);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = copy.weekdays[d.getDay()];
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${copy.deadlinePrefix}${month}/${day}${copy.openingParenthesis}${weekday}${copy.closingParenthesis}${hours}:${minutes}`;
}

function buildEventShareFlexMessage(info: EventShareInfo, voteUrl: string) {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const localePrefix = getLocalePrefix(pathname);
  const copy = getEventShareCopy(localePrefix);
  const title = info.title || copy.untitledEvent;
  const deadline = formatDeadline(info.votingDeadline, copy);

  const bodyContents: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `${copy.votePrefix}${title}`,
      weight: "bold",
      size: "lg",
      wrap: true,
      maxLines: 2,
      color: "#333333",
    },
  ];

  if (deadline) {
    bodyContents.push({
      type: "text",
      text: deadline,
      size: "sm",
      color: "#999999",
      margin: "md",
    });
  }

  bodyContents.push({
    type: "text",
    text: copy.instructionText,
    size: "sm",
    color: "#666666",
    wrap: true,
    margin: deadline ? "lg" : "xl",
  });

  return {
    type: "flex",
    altText: `${copy.votePrefix}${title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        paddingAll: "20px",
        paddingBottom: "16px",
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
              label: copy.voteButtonLabel,
              uri: voteUrl,
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
}

/**
 * 分享活動 Flex Message 到聊天室
 * 使用 shareTargetPicker 讓使用者選擇要分享的對象
 *
 * @returns ShareResult.Success - 使用者成功傳送
 * @returns ShareResult.Cancelled - 使用者取消（關閉選擇器）
 * @returns ShareResult.Error - 發生錯誤
 */
export async function shareEventFlexMessage(
  info: EventShareInfo,
  voteUrl: string,
): Promise<ShareResult> {
  const liff = await getLiff();
  if (!liff || !liff.isInClient()) {
    return ShareResult.Error;
  }

  try {
    const flexMessage = buildEventShareFlexMessage(info, voteUrl);
    const result = await liff.shareTargetPicker([
      flexMessage as Parameters<typeof liff.shareTargetPicker>[0][number],
    ]);

    // shareTargetPicker 回傳 undefined 或 status !== 'success' 表示使用者取消
    if (result && result.status === "success") {
      return ShareResult.Success;
    }
    return ShareResult.Cancelled;
  } catch (error) {
    console.error("Failed to share event flex message:", error);
    return ShareResult.Error;
  }
}
