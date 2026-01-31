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

function buildEventShareFlexMessage(info: EventShareInfo, voteUrl: string) {
  const formatDeadline = () => {
    if (!info.votingDeadline) return null;
    const d = new Date(info.votingDeadline);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const weekday = weekdays[d.getDay()];
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `截止：${month}/${day}（${weekday}）${hours}:${minutes}`;
  };

  const deadline = formatDeadline();

  const bodyContents: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `[投票] ${info.title || "未命名活動"}`,
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
    text: "請前往投票頁面中投票。",
    size: "sm",
    color: "#666666",
    wrap: true,
    margin: deadline ? "lg" : "xl",
  });

  return {
    type: "flex",
    altText: `[投票] ${info.title || "未命名活動"}`,
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
              label: "立即投票",
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
