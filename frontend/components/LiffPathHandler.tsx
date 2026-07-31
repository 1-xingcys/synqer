"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildLiffEntryUrl,
  getLiffStatePath,
  handleLiffPathRedirect,
  initializeLiff,
  isLineUserAgent,
  isLiffEnabled,
} from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";
import { LoadingState } from "@/components/ui/loading-state";
// TEMPORARY: loading-time instrumentation, remove with lib/perfTrace.ts
import { perfMark } from "@/lib/perfTrace";

const log = (message: string, data?: unknown) => {
  perfMark(`LiffPathHandler · ${message}`, data);
  debugLog("LiffPath", message, data);
};
const LIFF_AUTO_REDIRECT_KEY = "synqer:liff-auto-redirect:url";

/**
 * LiffPathHandler
 *
 * Handles LIFF path redirects and forwards the LINE in-app browser into LIFF.
 * When the app is opened as https://liff.line.me/{liffId}/{path}, LINE stores
 * {path} in the liff.state query parameter, and this component detects it and
 * redirects to the correct path.
 *
 * Must live in the root layout and run before any other auth logic.
 *
 * @param isLineClient Passed in by the root layout after checking the
 *   User-Agent, so the server already knows whether to block children.
 */
export function LiffPathHandler({
  children,
  isLineClient,
}: {
  children: React.ReactNode;
  isLineClient: boolean;
}): React.ReactNode {
  const searchParams = useSearchParams();

  // Only LIFF-related requests can ever redirect, so only they need to be held
  // back. A regular browser never redirects here, and blocking it would just
  // stop the whole tree from server rendering.
  const needsLiffCheck = isLineClient || searchParams.has("liff.state");

  // Three states: "checking" | "redirecting" | "done".
  // Children are not rendered until we know no redirect is needed, which avoids
  // loading unnecessary chunks while a redirect is in flight.
  const [status, setStatus] = useState<"checking" | "redirecting" | "done">(
    needsLiffCheck ? "checking" : "done",
  );

  useEffect(() => {
    perfMark("LiffPathHandler · effect", { needsLiffCheck, isLineClient });
    if (!needsLiffCheck) return;

    const handleLiffPath = async () => {
      try {
        // Check for a liff.state parameter
        const liffPath = getLiffStatePath();

        if (liffPath) {
          log("Found liff.state path", { liffPath });

          // Check whether a redirect is needed
          const targetPath = handleLiffPathRedirect();

          if (!targetPath) {
            log("No redirect needed");
            setStatus("done");
            return;
          }

          log("Redirecting to liff path", { targetPath });
          setStatus("redirecting");

          // With a LIFF ID, initialize LIFF first so the login state is kept
          if (isLiffEnabled()) {
            try {
              await initializeLiff();
              log("LIFF initialized before redirect");
            } catch (e) {
              log("LIFF init failed during path redirect", {
                error: String(e),
              });
            }
          }

          // Hard redirect via window.location.replace: it completes before any
          // other React logic runs and leaves no extra browser history entry
          window.location.replace(targetPath);
          return;
        }

        // No liff.state: try to forward a plain URL opened in the LINE in-app
        // browser over to LIFF
        if (!isLiffEnabled() || !isLineUserAgent()) {
          log("Skip LIFF auto redirect");
          setStatus("done");
          return;
        }

        const currentUrl = window.location.href;
        const lastAttemptUrl =
          sessionStorage.getItem(LIFF_AUTO_REDIRECT_KEY) ?? "";
        if (lastAttemptUrl === currentUrl) {
          log("Skip LIFF auto redirect (already attempted)", { currentUrl });
          setStatus("done");
          return;
        }

        const liffState = await initializeLiff();
        if (liffState.isInClient) {
          log("Already in LIFF client");
          setStatus("done");
          return;
        }

        const liffEntryUrl = buildLiffEntryUrl(currentUrl);
        if (!liffEntryUrl) {
          log("Unable to build LIFF entry URL");
          setStatus("done");
          return;
        }

        sessionStorage.setItem(LIFF_AUTO_REDIRECT_KEY, currentUrl);
        log("Redirecting LINE browser to LIFF", { liffEntryUrl });
        setStatus("redirecting");
        window.location.replace(liffEntryUrl);
      } catch (error) {
        log("LiffPathHandler failed", { error: String(error) });
        setStatus("done");
      }
    };

    void handleLiffPath();
  }, [needsLiffCheck, isLineClient]);

  // TEMPORARY: shows when children (and their chunks) finally start rendering
  useEffect(() => {
    perfMark(`LiffPathHandler · status = ${status}`);
  }, [status]);

  // Show loading while checking or redirecting. This avoids loading the
  // children's chunks mid-redirect and prevents "Failed to load chunk" errors.
  if (status === "checking" || status === "redirecting") {
    return (
      <LoadingState
        viewport="screen"
        background="muted"
        spinnerTone="neutral"
      />
    );
  }

  // status === "done"
  return children;
}
