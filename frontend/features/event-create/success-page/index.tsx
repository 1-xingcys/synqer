"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useLiffContext } from "@/contexts/LiffContext";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_OVERVIEW_PATH, eventDetailPath } from "@/lib/eventRoutes";
import {
  shareEventFlexMessage,
  type EventShareInfo,
  ShareResult,
} from "@/lib/line-flex-message";
import { Vote, Send, Share2, Check, Copy, Calendar } from "lucide-react";
import { apiFetchVoid } from "@/lib/apiClient";
import { ActionButton, ActionButtonVariant } from "./ActionButton";
import { LoadingState } from "@/components/ui/loading-state";
import { Spinner } from "@/components/ui/spinner";

const SendStatus = {
  Idle: "idle",
  Sending: "sending",
  Success: "success",
  Error: "error",
} as const;
type SendStatus = (typeof SendStatus)[keyof typeof SendStatus];

export default function CreateEventSuccessPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const t = useTranslations("createEvent.success");
  const router = useRouter();
  const { user } = useAuth();
  const { isInClient: isInLiff, isInitialized: liffInitialized } =
    useLiffContext();
  const { copied: linkCopied, copyLink: handleCopyLink } =
    useEventShareLink(eventId);
  const { data, isLoading, error } = useEventDetail(eventId);

  const [sendStatus, setSendStatus] = useState<SendStatus>(SendStatus.Idle);

  useEffect(() => {
    if (error) {
      router.replace(DEFAULT_OVERVIEW_PATH);
    }
  }, [error, router]);

  const eventData = data?.event;
  const eventTitle = eventData?.title;
  const lineGroupId = eventData?.lineGroupId;
  const votingDeadline = eventData?.votingDeadline;
  const eventTimeZone = eventData?.timeZone;

  // 分享到 LINE（使用 shareTargetPicker）
  const handleShareToLine = async () => {
    if (!eventId || sendStatus === SendStatus.Sending) return;

    setSendStatus(SendStatus.Sending);

    try {
      const shareInfo: EventShareInfo = {
        eventId,
        title: eventTitle || "",
        hostName: user?.displayName || "未知",
        hostAvatarUrl: user?.avatarUrl || undefined,
        votingDeadline: votingDeadline || undefined,
        timeZone: eventTimeZone || undefined,
      };

      const result = await shareEventFlexMessage(shareInfo);
      if (result === ShareResult.Success) {
        setSendStatus(SendStatus.Success);
      } else if (result === ShareResult.Cancelled) {
        // 使用者取消，不顯示錯誤，保持 idle 狀態讓使用者可以再次嘗試
        setSendStatus(SendStatus.Idle);
      } else {
        setSendStatus(SendStatus.Error);
      }
    } catch {
      setSendStatus(SendStatus.Error);
    }
  };

  // 發送到綁定的 LINE 群組（使用 Messaging API）
  const handleSendToLineGroup = async () => {
    if (!eventId || !lineGroupId || sendStatus === SendStatus.Sending) return;

    setSendStatus(SendStatus.Sending);

    try {
      await apiFetchVoid(`/line-bot/events/${eventId}/notify-group`, {
        method: "POST",
      });
      setSendStatus(SendStatus.Success);
    } catch {
      setSendStatus(SendStatus.Error);
    }
  };

  const showLineShareButton = isInLiff && liffInitialized;
  const hasLinkedGroup = !!lineGroupId;

  const getLineShareButtonProps = () => {
    let icon: React.ReactNode;
    if (sendStatus === SendStatus.Sending) {
      icon = <Spinner size="sm" />;
    } else if (sendStatus === SendStatus.Success) {
      icon = <Check className="w-5 h-5" />;
    } else if (hasLinkedGroup) {
      icon = <Send className="w-5 h-5" />;
    } else {
      icon = <Share2 className="w-5 h-5" />;
    }

    let title: string;
    if (sendStatus === SendStatus.Sending) {
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

    const description = hasLinkedGroup
      ? t("sendToLineGroupDescription")
      : t("shareToLineDescription");

    let variant: ActionButtonVariant;
    if (sendStatus === SendStatus.Success) {
      variant = ActionButtonVariant.Success;
    } else if (sendStatus === SendStatus.Error) {
      variant = ActionButtonVariant.Error;
    } else {
      variant = ActionButtonVariant.Highlight;
    }
    const disabled = sendStatus === SendStatus.Success;
    const onClick = hasLinkedGroup ? handleSendToLineGroup : handleShareToLine;

    return { icon, title, description, variant, disabled, onClick };
  };

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

  if (isLoading) {
    return <LoadingState viewport="section" spinnerTone="neutral" />;
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
            onClick={() => router.push(eventDetailPath(eventId, "vote"))}
            showArrow={true}
          />
        </div>
      </div>
    </div>
  );
}
