"use client";

import { useMemo, useCallback } from "react";
import { useCopyToClipboard } from "./useCopyToClipboard";
import { useLiff } from "./useLiff";

/**
 * 活動分享連結 hook
 * - LIFF 環境：使用 LIFF URL
 * - 一般瀏覽器：使用原生 URL
 */
export function useEventShareLink(eventId: string): {
  shareUrl: string;
  copied: boolean;
  copyLink: (e?: React.MouseEvent) => Promise<void>;
} {
  const { copied, copy } = useCopyToClipboard();
  const { isInClient } = useLiff();

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";

    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (isInClient && liffId) {
      return `https://liff.line.me/${liffId}/events/${eventId}`;
    }
    return `${window.location.origin}/events/${eventId}`;
  }, [isInClient, eventId]);

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
