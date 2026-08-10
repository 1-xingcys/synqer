"use client";

import { useTranslations } from "next-intl";
import { CheckCheck, Copy, Loader2, Send, Share } from "lucide-react";
import type { WallClock } from "@/lib/time";
import { VoteInviteFlexPreview } from "./VoteInviteFlexPreview";
import { LineShareStatus } from "./useCreateEventShare";

const PRIMARY_BUTTON =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_TONES = {
  // LINE's own brand green, so the button reads as "this leaves the app and
  // goes to LINE". It is the only saturated fill on the page, which is what
  // marks it as the one thing the host is here to do.
  line: "bg-[#06C755] text-white hover:bg-[#05B34C] dark:bg-[#0A7B39] dark:hover:bg-[#0F9B4A]",
  neutral: "bg-primary text-primary-foreground hover:bg-primary/90",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
  error:
    "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600",
};

interface CreateEventShareContentProps {
  eventTitle: string;
  votingDeadline?: WallClock;
  locale: string;
  shareText: string;
  shareTextCopied: boolean;
  canNativeShareText: boolean;
  canShareToLine: boolean;
  linkedGroupName: string | null;
  hasLinkedGroup: boolean;
  lineShareStatus: LineShareStatus;
  onShareShareText: () => Promise<void> | void;
  onShareToLine: () => Promise<void> | void;
}

export function CreateEventShareContent({
  eventTitle,
  votingDeadline,
  locale,
  shareText,
  shareTextCopied,
  canNativeShareText,
  canShareToLine,
  linkedGroupName,
  hasLinkedGroup,
  lineShareStatus,
  onShareShareText,
  onShareToLine,
}: CreateEventShareContentProps) {
  const t = useTranslations("createEvent.success");
  const isSending = lineShareStatus === LineShareStatus.Sending;

  let tone: keyof typeof BUTTON_TONES;
  let icon: React.ReactNode;
  let label: string;

  if (!canShareToLine) {
    // The copied state only appears on the clipboard fallback: a native share
    // sheet closing is its own confirmation, so there is nothing to report.
    if (shareTextCopied) {
      tone = "success";
      icon = <CheckCheck className="h-5 w-5" />;
      label = t("shareTextCopied");
    } else if (canNativeShareText) {
      tone = "neutral";
      icon = <Share className="h-5 w-5" />;
      label = t("shareShareText");
    } else {
      tone = "neutral";
      icon = <Copy className="h-5 w-5" />;
      label = t("copyShareText");
    }
  } else {
    tone = "line";
    icon = <Send className="h-5 w-5" />;

    if (isSending) {
      icon = <Loader2 className="h-5 w-5 animate-spin" />;
      label = t("sharingToLine");
    } else if (lineShareStatus === LineShareStatus.Success) {
      tone = "success";
      icon = <CheckCheck className="h-5 w-5" />;
      label = t("sharedToLine");
    } else if (lineShareStatus === LineShareStatus.Error) {
      tone = "error";
      label = t("shareToLineFailed");
    } else if (hasLinkedGroup) {
      // Naming the group is the whole point: "send to LINE group" leaves the
      // host guessing which chat is about to get the invite.
      label = linkedGroupName
        ? t("sendToNamedGroup", { groupName: linkedGroupName })
        : t("sendToLineGroup");
    } else {
      label = t("shareToLine");
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="p-5">
        <div className="space-y-1 text-center">
          <h2 className="text-base font-semibold text-foreground">
            {t("invite.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {canShareToLine
              ? t("invite.lineSubtitle")
              : t("invite.textSubtitle")}
          </p>
        </div>

        {canShareToLine ? (
          <div
            className="mt-4 flex justify-center rounded-xl p-4"
            style={{ backgroundColor: "#8698BF" }}
          >
            <VoteInviteFlexPreview
              eventTitle={eventTitle}
              votingDeadline={votingDeadline}
              locale={locale}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/90">
              {shareText}
            </pre>
          </div>
        )}

        <button
          onClick={() =>
            void (canShareToLine ? onShareToLine() : onShareShareText())
          }
          disabled={isSending}
          className={`mt-4 ${PRIMARY_BUTTON} ${BUTTON_TONES[tone]}`}
        >
          {icon}
          {label}
        </button>
      </div>
    </div>
  );
}
