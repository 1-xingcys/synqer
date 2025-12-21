"use client";

import { useEffect, useState } from "react";
import {
  getLiffStatePath,
  handleLiffPathRedirect,
  initializeLiff,
  isLiffEnabled,
} from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";

const log = (message: string, data?: unknown) =>
  debugLog("LiffPath", message, data);

/**
 * LiffPathHandler
 *
 * 處理 LIFF 路徑重定向的組件。
 * 當使用 https://liff.line.me/{liffId}/{path} 格式開啟時，
 * LINE 會把 {path} 存在 liff.state query parameter 中，
 * 這個組件負責檢測並重定向到正確的路徑。
 *
 * 必須放在 root layout 中，在其他認證邏輯之前執行。
 */
export function LiffPathHandler({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  // 使用 "checking" | "redirecting" | "done" 三種狀態
  // 初始值是 "checking"，在確認不需要重定向之前不渲染 children
  // 這可以避免在重定向過程中載入不必要的 chunks
  const [status, setStatus] = useState<"checking" | "redirecting" | "done">(
    "checking",
  );

  useEffect(() => {
    const handleLiffPath = async () => {
      // 檢查是否有 liff.state 參數
      const liffPath = getLiffStatePath();

      if (!liffPath) {
        log("No liff.state path found");
        setStatus("done");
        return;
      }

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
          log("LIFF init failed during path redirect", { error: String(e) });
        }
      }

      // 使用 window.location.replace 進行硬重定向
      // 這確保在任何其他 React 邏輯執行之前完成重定向
      // 並且不會在瀏覽器歷史中產生新條目
      window.location.replace(targetPath);
    };

    void handleLiffPath();
  }, []);

  // 正在檢查或重定向時顯示 loading
  // 這可以避免在重定向過程中載入 children 的 chunks，防止 "Failed to load chunk" 錯誤
  if (status === "checking" || status === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  // status === "done"
  return children;
}
