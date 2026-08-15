"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlignLeft,
  CheckCheck,
  Copy,
  Loader2,
  MessageSquare,
  Send,
  Share,
} from "lucide-react";
import { type HostedEventResultSummary } from "@/lib/event/hostedEventResultSummary";
import { EventResultFlexPreview } from "./EventResultFlexPreview";
import { EventResultTextPreview } from "./EventResultTextPreview";

type ShareTab = "line" | "text";

/**
 * Tone of the single call to action. The share button is the only coloured
 * thing in the sheet, so progress and failure land there rather than tinting
 * the preview — the preview must keep showing the message as it will look.
 */
type ActionTone = "brand" | "neutral" | "success" | "error";

const ACTION_TONE_STYLES: Record<ActionTone, string> = {
  // LINE's own brand green, so the button reads as "this goes to LINE".
  brand:
    "bg-[#06C755] text-white hover:bg-[#05B34C] dark:bg-[#0A7B39] dark:hover:bg-[#0F9B4A]",
  neutral:
    "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
  // Same reasoning as brand: the light-mode fills glare on a dark sheet, and
  // hover goes lighter than rest in dark mode rather than darker.
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
  error:
    "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600",
};

interface EventResultShareContentProps {
  onClose: () => void;
  eventTitle: string;
  locale: string;
  resultText: string;
  resultSummary: HostedEventResultSummary | null;
  canNativeShareResultText: boolean;
  resultTextCopied: boolean;
  onShareResultText: () => Promise<boolean> | boolean;
  showShareToLineOption: boolean;
  lineShareStatus: "idle" | "sending" | "success" | "error";
  onShareToLine: () => Promise<boolean> | boolean;
}

/**
 * The body of the share sheet: what you are about to send, then one button
 * that sends it.
 *
 * The two share targets produce visibly different messages, so they are tabs
 * over a single preview frame rather than two rows — one preview at a time
 * keeps the sheet a fixed height, and the button below always belongs to the
 * thing currently on screen.
 *
 * Mounted only while the sheet is open (ShareSheet drops its children when
 * closed), so the selected tab starts fresh on every open.
 */
export function EventResultShareContent({
  onClose,
  eventTitle,
  locale,
  resultText,
  resultSummary,
  canNativeShareResultText,
  resultTextCopied,
  onShareResultText,
  showShareToLineOption,
  lineShareStatus,
  onShareToLine,
}: EventResultShareContentProps) {
  const t = useTranslations("eventInfo");
  const canShowLineTab = showShareToLineOption && Boolean(resultSummary);
  const [selectedTab, setSelectedTab] = useState<ShareTab>(
    canShowLineTab ? "line" : "text",
  );
  const activeTab: ShareTab = canShowLineTab ? selectedTab : "text";

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

  const action =
    activeTab === "line"
      ? lineShareAction(lineShareStatus, t)
      : textShareAction(canNativeShareResultText, resultTextCopied, t);

  return (
    <div className="space-y-3">
      {canShowLineTab && (
        <div
          role="tablist"
          aria-label={t("sharePreview.tabsLabel")}
          className="flex gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
        >
          <TabButton
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            label={t("sharePreview.lineTab")}
            isActive={activeTab === "line"}
            onClick={() => setSelectedTab("line")}
          />
          <TabButton
            icon={<AlignLeft className="h-3.5 w-3.5" />}
            label={t("sharePreview.textTab")}
            isActive={activeTab === "text"}
            onClick={() => setSelectedTab("text")}
          />
        </div>
      )}

      {/* Both canvases share a min height so switching tabs does not resize
          the sheet under the pointer, and each scrolls internally so the
          button below stays reachable however many ranges there are. */}
      <div
        role="tabpanel"
        className="max-h-[45vh] min-h-[13rem] overflow-y-auto rounded-xl"
      >
        {activeTab === "line" && resultSummary ? (
          <div
            className="flex justify-center p-3 sm:p-4"
            style={{ backgroundColor: "#8698BF" }}
          >
            <EventResultFlexPreview
              eventTitle={eventTitle}
              summary={resultSummary}
              locale={locale}
            />
          </div>
        ) : (
          <div className="h-full border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <EventResultTextPreview text={resultText} />
          </div>
        )}
      </div>

      <button
        onClick={() =>
          void (activeTab === "line"
            ? handleShareToLineClick()
            : handleShareResultTextClick())
        }
        disabled={activeTab === "line" && lineShareStatus === "sending"}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${ACTION_TONE_STYLES[action.tone]}`}
      >
        {action.icon}
        {action.label}
      </button>
    </div>
  );
}

function TabButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
        isActive
          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

type ShareActionViewState = {
  icon: React.ReactNode;
  label: string;
  tone: ActionTone;
};

function textShareAction(
  canNativeShare: boolean,
  copied: boolean,
  t: (key: string) => string,
): ShareActionViewState {
  if (canNativeShare) {
    return {
      icon: <Share className="h-4 w-4" />,
      label: t("shareResultText"),
      tone: "neutral",
    };
  }

  return copied
    ? {
        icon: <CheckCheck className="h-4 w-4" />,
        label: t("resultTextCopied"),
        tone: "success",
      }
    : {
        icon: <Copy className="h-4 w-4" />,
        label: t("copyResultText"),
        tone: "neutral",
      };
}

function lineShareAction(
  status: "idle" | "sending" | "success" | "error",
  t: (key: string) => string,
): ShareActionViewState {
  if (status === "sending") {
    return {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: t("sharingToLine"),
      tone: "brand",
    };
  }

  if (status === "success") {
    return {
      icon: <CheckCheck className="h-4 w-4" />,
      label: t("sharedToLine"),
      tone: "success",
    };
  }

  if (status === "error") {
    return {
      icon: <Send className="h-4 w-4" />,
      label: t("shareToLineFailed"),
      tone: "error",
    };
  }

  return {
    icon: <Send className="h-4 w-4" />,
    label: t("shareToLine"),
    tone: "brand",
  };
}
