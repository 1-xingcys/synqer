"use client";

import { useTranslations } from "next-intl";
import { CheckCheck, Copy, Loader2, Share, Share2 } from "lucide-react";
import {
  ShareOption,
  ShareSheet,
  type ShareOptionTone,
} from "@/components/ui/ShareSheet";

interface EventResultShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  canNativeShareResultText: boolean;
  resultTextCopied: boolean;
  onShareResultText: () => Promise<boolean> | boolean;
  showShareToLineOption: boolean;
  lineShareStatus: "idle" | "sending" | "success" | "error";
  onShareToLine: () => Promise<boolean> | boolean;
}

type ShareActionViewState = {
  icon: React.ReactNode;
  label: string;
  tone: ShareOptionTone;
};

export function EventResultShareModal({
  isOpen,
  onClose,
  canNativeShareResultText,
  resultTextCopied,
  onShareResultText,
  showShareToLineOption,
  lineShareStatus,
  onShareToLine,
}: EventResultShareModalProps) {
  const tCommon = useTranslations("common");
  const tEventInfo = useTranslations("eventInfo");

  const handleShareResultTextClick = async () => {
    const didShare = await onShareResultText();
    if (didShare && canNativeShareResultText) {
      onClose();
    }
  };

  const handleShareToLineClick = async () => {
    if (lineShareStatus === "sending") return;

    const didShare = await onShareToLine();
    if (didShare) {
      onClose();
    }
  };

  const resultTextAction: ShareActionViewState = canNativeShareResultText
    ? {
        icon: <Share className="h-4 w-4" />,
        label: tEventInfo("shareResultText"),
        tone: "default",
      }
    : {
        icon: resultTextCopied ? (
          <CheckCheck className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        ),
        label: resultTextCopied
          ? tEventInfo("resultTextCopied")
          : tEventInfo("copyResultText"),
        tone: resultTextCopied ? "success" : "default",
      };

  const lineShareAction: ShareActionViewState = (() => {
    if (lineShareStatus === "sending") {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        label: tEventInfo("sharingToLine"),
        tone: "default",
      };
    }

    if (lineShareStatus === "success") {
      return {
        icon: <CheckCheck className="h-4 w-4" />,
        label: tEventInfo("sharedToLine"),
        tone: "success",
      };
    }

    if (lineShareStatus === "error") {
      return {
        icon: <Share2 className="h-4 w-4" />,
        label: tEventInfo("shareToLineFailed"),
        tone: "error",
      };
    }

    return {
      icon: <Share2 className="h-4 w-4" />,
      label: tEventInfo("shareToLine"),
      tone: "default",
    };
  })();

  return (
    <ShareSheet
      isOpen={isOpen}
      onClose={onClose}
      title={tEventInfo("shareResultTitle")}
      closeLabel={tCommon("close")}
    >
      <ShareOption
        icon={resultTextAction.icon}
        label={resultTextAction.label}
        tone={resultTextAction.tone}
        onClick={() => void handleShareResultTextClick()}
      />

      {showShareToLineOption && (
        <ShareOption
          icon={lineShareAction.icon}
          label={lineShareAction.label}
          tone={lineShareAction.tone}
          disabled={lineShareStatus === "sending"}
          onClick={() => void handleShareToLineClick()}
        />
      )}
    </ShareSheet>
  );
}
