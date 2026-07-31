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

const log = (message: string, data?: unknown) =>
  debugLog("LiffPath", message, data);
const LIFF_AUTO_REDIRECT_KEY = "synqer:liff-auto-redirect:url";

/**
 * LiffPathHandler
 *
 * 處理 LIFF 路徑重定向與 LINE client 中轉 LIFF 的組件。
 * 當使用 https://liff.line.me/{liffId}/{path} 格式開啟時，
 * LINE 會把 {path} 存在 liff.state query parameter 中，
 * 這個組件負責檢測並重定向到正確的路徑。
 *
 * 必須放在 root layout 中，在其他認證邏輯之前執行。
 *
 * @param isLineClient 由 root layout 從 User-Agent 判斷後傳入，讓 server 端
 *   就能知道要不要擋住 children。
 */
export function LiffPathHandler({
  children,
  isLineClient,
}: {
  children: React.ReactNode;
  isLineClient: boolean;
}): React.ReactNode {
  const searchParams = useSearchParams();

  // 只有 LIFF 相關的請求才可能發生重定向，也只有它們需要被擋住。
  // 一般瀏覽器沒有任何重定向會發生，擋住只會讓整棵樹無法 server render。
  const needsLiffCheck = isLineClient || searchParams.has("liff.state");

  // 使用 "checking" | "redirecting" | "done" 三種狀態
  // 在確認不需要重定向之前不渲染 children
  // 這可以避免在重定向過程中載入不必要的 chunks
  const [status, setStatus] = useState<"checking" | "redirecting" | "done">(
    needsLiffCheck ? "checking" : "done",
  );

  useEffect(() => {
    if (!needsLiffCheck) return;

    const handleLiffPath = async () => {
      try {
        // 檢查是否有 liff.state 參數
        const liffPath = getLiffStatePath();

        if (liffPath) {
          log("Found liff.state path", { liffPath });

          // 檢查是否需要重定向
          const targetPath = handleLiffPathRedirect();

          if (!targetPath) {
            log("No redirect needed");
            setStatus("done");
            return;
          }

          log("Redirecting to liff path", { targetPath });
          setStatus("redirecting");

          // 如果有 LIFF ID，先初始化 LIFF 以確保登入狀態被保留
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

          // 使用 window.location.replace 進行硬重定向
          // 這確保在任何其他 React 邏輯執行之前完成重定向
          // 並且不會在瀏覽器歷史中產生新條目
          window.location.replace(targetPath);
          return;
        }

        // 沒有 liff.state，嘗試將 LINE 內建瀏覽器中打開的原生網址中轉到 LIFF
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
  }, [needsLiffCheck]);

  // 正在檢查或重定向時顯示 loading
  // 這可以避免在重定向過程中載入 children 的 chunks，防止 "Failed to load chunk" 錯誤
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
