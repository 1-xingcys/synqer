"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { useLiffContext } from "@/contexts/LiffContext";
import { apiFetchVoid } from "@/lib/apiClient";
import { shareEventFlexMessage, ShareResult } from "@/lib/line-flex-message";
import {
  canShareText,
  shareText as openNativeShareSheet,
  TextShareResult,
} from "@/lib/shareText";
import type { WallClock } from "@/lib/time";
import { buildVoteInviteShareText } from "./voteInviteShareText";

export const LineShareStatus = {
  Idle: "idle",
  Sending: "sending",
  Success: "success",
  Error: "error",
} as const;

export type LineShareStatus =
  (typeof LineShareStatus)[keyof typeof LineShareStatus];

/**
 * Everything the freshly-created event's share block needs: the message it is
 * about to send, and the two ways of sending it.
 */
export function useCreateEventShare(opts: {
  eventId: string;
  eventTitle: string;
  hostName: string;
  hostAvatarUrl?: string;
  votingDeadline?: WallClock;
  timeZone?: string;
  lineGroupId?: string | null;
  linkedGroupName?: string | null;
  locale: string;
}) {
  const { shareUrl } = useEventShareLink(opts.eventId);
  const { copied: shareTextCopied, copy: copyShareText } = useCopyToClipboard();
  const {
    isInClient: isInLiffClient,
    isInitialized: isLiffInitialized,
    closeWindow,
  } = useLiffContext();
  const [lineShareStatus, setLineShareStatus] = useState<LineShareStatus>(
    LineShareStatus.Idle,
  );
  // The native share sheet is modal and reports its own progress, so this only
  // needs to stop a second call while one is open.
  const isSharingText = useRef(false);

  // Read through useSyncExternalStore rather than called during render: the
  // server has no navigator, and a plain call would hand the two renders
  // different answers. There is nothing to subscribe to — the capability
  // never changes for the life of the page.
  const canNativeShareText = useSyncExternalStore(
    subscribeToNothing,
    canShareText,
    () => false,
  );

  const canShareToLine = isInLiffClient && isLiffInitialized;
  const hasLinkedGroup = Boolean(opts.lineGroupId);

  // Built up front rather than inside the handler: the block previews the
  // very same string it is about to copy.
  const shareText = buildVoteInviteShareText({
    eventTitle: opts.eventTitle,
    shareUrl,
    locale: opts.locale,
    votingDeadline: opts.votingDeadline,
  });

  /**
   * Hands the text to the OS share sheet where that exists, and falls back to
   * the clipboard where it does not (desktop Firefox, older browsers).
   *
   * Nothing is rendered on a successful native share: the sheet closing is
   * its own confirmation. The copied state exists precisely because the
   * clipboard gives no such feedback.
   */
  const handleShareShareText = async () => {
    if (!canNativeShareText) {
      await copyShareText(shareText);
      return;
    }

    if (isSharingText.current) return;
    isSharingText.current = true;

    try {
      const result = await openNativeShareSheet({ text: shareText });
      // Cancelling is not a failure, and a failed sheet still leaves the host
      // with a message they can take away, so fall back rather than error.
      if (result === TextShareResult.Error) {
        await copyShareText(shareText);
      }
    } finally {
      isSharingText.current = false;
    }
  };

  const handleShareToLine = async () => {
    if (!canShareToLine || lineShareStatus === LineShareStatus.Sending) {
      return;
    }

    setLineShareStatus(LineShareStatus.Sending);

    const succeeded = hasLinkedGroup
      ? await pushToLinkedGroup(opts.eventId)
      : await openShareTargetPicker(opts);

    if (succeeded === ShareResult.Success) {
      setLineShareStatus(LineShareStatus.Success);
      // Success is still rendered before this: closeWindow is a no-op outside
      // the LINE app, and the host should see what happened either way.
      await closeWindow();
      return;
    }

    setLineShareStatus(
      succeeded === ShareResult.Cancelled
        ? LineShareStatus.Idle
        : LineShareStatus.Error,
    );
  };

  return {
    shareText,
    shareTextCopied,
    canNativeShareText,
    canShareToLine,
    hasLinkedGroup,
    linkedGroupName: opts.linkedGroupName ?? null,
    lineShareStatus,
    handleShareShareText,
    handleShareToLine,
  };
}

/** The share capability never changes, so there is nothing to listen to. */
function subscribeToNothing() {
  return () => {};
}

async function pushToLinkedGroup(eventId: string): Promise<ShareResult> {
  try {
    await apiFetchVoid(`/line-bot/events/${eventId}/notify-group`, {
      method: "POST",
    });
    return ShareResult.Success;
  } catch {
    return ShareResult.Error;
  }
}

async function openShareTargetPicker(opts: {
  eventId: string;
  eventTitle: string;
  hostName: string;
  hostAvatarUrl?: string;
  votingDeadline?: WallClock;
  timeZone?: string;
}): Promise<ShareResult> {
  try {
    return await shareEventFlexMessage({
      eventId: opts.eventId,
      title: opts.eventTitle,
      hostName: opts.hostName,
      hostAvatarUrl: opts.hostAvatarUrl,
      votingDeadline: opts.votingDeadline,
      timeZone: opts.timeZone,
    });
  } catch {
    return ShareResult.Error;
  }
}
