"use client";

import { useMemo, useCallback } from "react";
import { useCopyToClipboard } from "./useCopyToClipboard";

/**
 * 活動分享連結 hook
 * - 一律使用原生 URL，提升跨平台可開啟性
 */
export function useEventShareLink(eventId: string): {
  shareUrl: string;
  copied: boolean;
  copyLink: (e?: React.MouseEvent) => Promise<void>;
} {
  const { copied, copy } = useCopyToClipboard();

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/events/${eventId}`;
  }, [eventId]);

  const copyLink = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return copy(shareUrl);
    },
    [copy, shareUrl],
  );

  return { shareUrl, copied, copyLink };
}
