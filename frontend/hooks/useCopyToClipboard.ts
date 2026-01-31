"use client";

import { useState, useCallback } from "react";

/**
 * 複製文字到剪貼簿的通用 hook
 */
export function useCopyToClipboard(resetDelay = 2000): {
  copied: boolean;
  copy: (text: string) => Promise<void>;
} {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
      } catch {
        // Ignore error
      }
    },
    [resetDelay],
  );

  return { copied, copy };
}
