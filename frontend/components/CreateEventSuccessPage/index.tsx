"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useLiff } from "@/hooks/useLiff";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  shareEventFlexMessage,
  type EventShareInfo,
  ShareResult,
} from "@/lib/line-flex-message";
import {
  Settings,
  Vote,
  Send,
  Share2,
  Check,
  Loader2,
  Copy,
  Calendar,
} from "lucide-react";
import { ActionButton, ActionButtonVariant } from "./ActionButton";
import { formatMinutesToTime } from "@/lib/utils";

const SendStatus = {
  Idle: "idle",
  Success: "success",
  Error: "error",
} as const;
type SendStatus = (typeof SendStatus)[keyof typeof SendStatus];

interface EventData {
  id: string;
  title?: string;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  timeZone: string;
  votingDeadline?: string;
  lineGroupId?: string;
}

export default function CreateEventSuccessPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const t = useTranslations("createEvent.success");
  const router = useRouter();
  const { user } = useAuthContext();
  const { isInClient: isInLiff, isInitialized: liffInitialized } = useLiff();
  const {
    shareUrl,
    copied: linkCopied,
    copyLink: handleCopyLink,
  } = useEventShareLink(eventId);

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>(SendStatus.Idle);

  // 抓取活動資料
  const fetchEventData = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }

      const data = (await response.json()) as { event: EventData };
      setEventData(data.event);
    } catch {
      router.replace("/joined");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    void fetchEventData();
  }, [fetchEventData]);

  // 從 eventData 取得資料
  const eventTitle = eventData?.title;
  const lineGroupId = eventData?.lineGroupId;
  const startDate = eventData?.startDate?.split("T")[0];
  const endDate = eventData?.endDate?.split("T")[0];
  const startTime = eventData
    ? formatMinutesToTime(eventData.startMinuteOfDay)
    : undefined;
  const endTime = eventData
    ? formatMinutesToTime(eventData.endMinuteOfDay)
    : undefined;
  const votingDeadline = eventData?.votingDeadline;

  // 分享到 LINE（使用 shareTargetPicker）
  const handleShareToLine = async () => {
    if (!eventId || !startDate || !endDate || !startTime || !endTime || sending)
      return;

    setSending(true);
    setSendStatus(SendStatus.Idle);

    try {
      const shareInfo: EventShareInfo = {
        eventId,
        title: eventTitle || "",
        hostName: user?.displayName || "未知",
        hostAvatarUrl: user?.avatarUrl || undefined,
        startDate,
        endDate,
        startTime,
        endTime,
        votingDeadline: votingDeadline || undefined,
      };

      const result = await shareEventFlexMessage(shareInfo, shareUrl);
      if (result === ShareResult.Success) {
        setSendStatus(SendStatus.Success);
      } else if (result === ShareResult.Cancelled) {
        // 使用者取消，不顯示錯誤，保持 idle 狀態讓使用者可以再次嘗試
        setSendStatus(SendStatus.Idle);
      } else {
        setSendStatus(SendStatus.Error);
      }
    } catch (error) {
      console.error("Failed to share to LINE:", error);
      setSendStatus(SendStatus.Error);
    } finally {
      setSending(false);
    }
  };

  // 發送到綁定的 LINE 群組（使用 Messaging API）
  const handleSendToLineGroup = async () => {
    if (!eventId || !lineGroupId || sending) return;

    setSending(true);
    setSendStatus(SendStatus.Idle);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/line-bot/events/${eventId}/notify-group`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setSendStatus(SendStatus.Success);
      } else {
        setSendStatus(SendStatus.Error);
      }
    } catch (error) {
      console.error("Failed to send to LINE group:", error);
      setSendStatus(SendStatus.Error);
    } finally {
      setSending(false);
    }
  };

  // 判斷顯示哪種按鈕
  // 在 LIFF 環境中才顯示分享按鈕
  const showLineShareButton = isInLiff && liffInitialized;
  // 有綁定群組時用 Messaging API 發送
  const hasLinkedGroup = !!lineGroupId;

  // 預先計算 LINE 分享按鈕的 props
  const getLineShareButtonProps = () => {
    // 計算 icon
    let icon: React.ReactNode;
    if (sending) {
      icon = <Loader2 className="w-5 h-5 animate-spin" />;
    } else if (sendStatus === SendStatus.Success) {
      icon = <Check className="w-5 h-5" />;
    } else if (hasLinkedGroup) {
      icon = <Send className="w-5 h-5" />;
    } else {
      icon = <Share2 className="w-5 h-5" />;
    }

    // 計算 title
    let title: string;
    if (sending) {
      title = t("sending");
    } else if (sendStatus === SendStatus.Success) {
      title = t("sentSuccess");
    } else if (sendStatus === SendStatus.Error) {
      title = t("sentFailed");
    } else if (hasLinkedGroup) {
      title = t("sendToLineGroup");
    } else {
      title = t("shareToLine");
    }

    // 計算 description
    const description = hasLinkedGroup
      ? t("sendToLineGroupDescription")
      : t("shareToLineDescription");

    // 計算 variant
    let variant: ActionButtonVariant;
    if (sendStatus === SendStatus.Success) {
      variant = ActionButtonVariant.Success;
    } else if (sendStatus === SendStatus.Error) {
      variant = ActionButtonVariant.Error;
    } else {
      variant = ActionButtonVariant.Highlight;
    }

    // 計算 disabled
    const disabled = sending || sendStatus === SendStatus.Success;

    // 計算 onClick
    const onClick = hasLinkedGroup ? handleSendToLineGroup : handleShareToLine;

    return { icon, title, description, variant, disabled, onClick };
  };

  // 預先計算複製連結按鈕的 props
  const getCopyLinkButtonProps = () => {
    const icon = linkCopied ? (
      <Check className="w-5 h-5" />
    ) : (
      <Copy className="w-5 h-5" />
    );
    const title = linkCopied ? t("linkCopied") : t("copyLink");
    const description = t("copyLinkDescription");
    const variant = linkCopied
      ? ActionButtonVariant.Success
      : ActionButtonVariant.Default;

    return { icon, title, description, variant };
  };

  const lineShareButtonProps = getLineShareButtonProps();
  const copyLinkButtonProps = getCopyLinkButtonProps();

  // Loading 狀態
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!eventData) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-md mx-auto py-10 px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 標題與描述 */}
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {t("description")}
        </p>
      </div>

      {/* 活動小卡片 */}
      {eventTitle && (
        <div className="w-full mb-10">
          <div className="relative overflow-hidden rounded-xl border bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-card">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Calendar className="w-24 h-24" />
            </div>
            <div className="relative z-10 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                {t("eventName")}
              </p>
              <p className="text-xl font-semibold text-foreground warp-break-words leading-tight">
                {eventTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 操作按鈕群組 */}
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs font-medium text-muted-foreground">
            {t("nextSteps")}
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* LINE 分享/發送按鈕 */}
        {showLineShareButton && (
          <ActionButton
            icon={lineShareButtonProps.icon}
            title={lineShareButtonProps.title}
            description={lineShareButtonProps.description}
            onClick={() => void lineShareButtonProps.onClick()}
            disabled={lineShareButtonProps.disabled}
            variant={lineShareButtonProps.variant}
            showArrow={false}
          />
        )}

        {/* 複製連結 */}
        <ActionButton
          icon={copyLinkButtonProps.icon}
          title={copyLinkButtonProps.title}
          description={copyLinkButtonProps.description}
          onClick={() => void handleCopyLink()}
          variant={copyLinkButtonProps.variant}
          showArrow={false}
        />

        <div className="pt-2 space-y-3">
          {/* 前往投票頁面 */}
          <ActionButton
            icon={<Vote className="w-5 h-5" />}
            title={t("goToVote")}
            description={t("goToVoteDescription")}
            onClick={() => router.push(`/joined/${eventId}`)}
            showArrow={true}
          />

          {/* 前往管理頁面 */}
          <ActionButton
            icon={<Settings className="w-5 h-5" />}
            title={t("goToManage")}
            description={t("goToManageDescription")}
            onClick={() => router.push(`/hosted/${eventId}`)}
            showArrow={true}
          />
        </div>
      </div>
    </div>
  );
}
