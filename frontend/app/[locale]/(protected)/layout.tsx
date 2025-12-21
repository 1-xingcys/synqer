"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Sidebar from "@/components/ui/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { LiffProvider } from "@/contexts/LiffContext";
import {
  initializeLiff,
  getLiffAccessToken,
  isLiffEnabled,
  liffLogin,
  type LiffState,
} from "@/lib/liff";

// Debug 日誌類型
interface DebugLog {
  time: string;
  message: string;
  data?: unknown;
}

// Debug Panel Props
interface DebugPanelProps {
  logs: DebugLog[];
  liffState: LiffState | null;
  pathname: string;
  sessionStatus: string;
  checked: boolean;
  onHide: () => void;
}

// Debug UI 組件 - 移到組件外部
function DebugPanel({
  logs,
  liffState,
  pathname,
  sessionStatus,
  checked,
  onHide,
}: DebugPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 text-white text-xs max-h-[50vh] overflow-auto">
      <div className="flex items-center justify-between p-2 bg-zinc-800 sticky top-0">
        <span className="font-bold">🔧 Protected Layout Debug</span>
        <button onClick={onHide} className="px-2 py-1 bg-red-600 rounded">
          Hide
        </button>
      </div>
      <div className="p-2 space-y-2">
        <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-800 rounded">
          <div>
            <span className="text-zinc-400">Pathname:</span> {pathname}
          </div>
          <div>
            <span className="text-zinc-400">Session:</span>{" "}
            <span
              className={
                sessionStatus === "authenticated"
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {sessionStatus}
            </span>
          </div>
          <div>
            <span className="text-zinc-400">LIFF Enabled:</span>{" "}
            {isLiffEnabled() ? "Yes" : "No"}
          </div>
          <div>
            <span className="text-zinc-400">Checked:</span>{" "}
            {checked ? "Yes" : "No"}
          </div>
        </div>
        {liffState && (
          <div className="p-2 bg-zinc-800 rounded">
            <div className="font-bold mb-1">LIFF State:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                isInitialized:{" "}
                <span
                  className={
                    liffState.isInitialized ? "text-green-400" : "text-red-400"
                  }
                >
                  {String(liffState.isInitialized)}
                </span>
              </div>
              <div>
                isInClient:{" "}
                <span
                  className={
                    liffState.isInClient ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {String(liffState.isInClient)}
                </span>
              </div>
              <div>
                isLoggedIn:{" "}
                <span
                  className={
                    liffState.isLoggedIn ? "text-green-400" : "text-red-400"
                  }
                >
                  {String(liffState.isLoggedIn)}
                </span>
              </div>
              {liffState.error && (
                <div className="col-span-2 text-red-400">
                  Error: {liffState.error.message}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="p-2 bg-zinc-800 rounded">
          <div className="font-bold mb-1">Logs:</div>
          {logs.map((log, i) => (
            <div key={i} className="py-0.5 border-b border-zinc-700">
              <span className="text-zinc-500">[{log.time}]</span> {log.message}
              {log.data !== undefined && (
                <pre className="text-zinc-400 ml-4 text-[10px]">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * ProtectedLayoutContent
 * 內部組件，可以使用 SidebarContext 並渲染統一的 Sidebar
 */
function ProtectedLayoutContent({ children }: ProtectedLayoutProps) {
  const { isOpen, toggle, close } = useSidebar();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Header with hamburger button */}
      <Header variant="protected" onMenuClick={toggle} />

      {/* Sidebar + Content 容器 */}
      <div className="w-full">
        <div className="flex gap-6 items-start">
          {/* 統一的 Sidebar - 內容由 Sidebar 組件內部自動設置 */}
          <Sidebar isOpen={isOpen} onClose={close} />

          {/* Main Content */}
          <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8">
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ProtectedLayout
 * 為所有受保護的頁面提供統一的佈局結構
 *
 * 包含：
 * 1. 認證檢查（支援 Session 和 LIFF 兩種方式）
 * 2. SidebarContext（用於共享 sidebar 狀態）
 * 3. LiffContext（用於 LIFF 相關功能）
 * 4. Header（ProtectedHeader）
 * 5. 基本容器結構
 *
 * 認證流程：
 * 1. 先檢查是否有有效的 session
 * 2. 如果沒有 session，且在 LIFF 環境中已登入，嘗試用 LIFF access token 登入
 * 3. 如果都失敗，導向登入頁面
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [checked, setChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Debug 狀態
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [liffState, setLiffState] = useState<LiffState | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("checking");

  const addLog = useCallback((message: string, data?: unknown) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, { time, message, data }]);
    console.log(`[Protected ${time}]`, message, data ?? "");
  }, []);

  /**
   * 嘗試使用 LIFF Access Token 登入
   */
  const tryLiffLogin = useCallback(async (): Promise<boolean> => {
    if (!isLiffEnabled()) {
      addLog("LIFF not enabled");
      return false;
    }

    try {
      // 初始化 LIFF
      addLog("Initializing LIFF...");
      const liffStateResult = await initializeLiff();
      setLiffState(liffStateResult);
      addLog("LIFF initialized", {
        isInitialized: liffStateResult.isInitialized,
        isInClient: liffStateResult.isInClient,
        isLoggedIn: liffStateResult.isLoggedIn,
        error: liffStateResult.error?.message,
      });

      if (!liffStateResult.isInitialized) {
        addLog("LIFF init failed", liffStateResult.error?.message);
        return false;
      }

      // 如果在 LIFF 內但未登入，觸發 LIFF 登入
      if (liffStateResult.isInClient && !liffStateResult.isLoggedIn) {
        addLog("In LIFF client but not logged in, triggering login...");
        await liffLogin(window.location.href);
        // liffLogin 會重新導向，所以這裡直接返回
        return true;
      }

      // 如果已經登入 LIFF，取得 access token 並送到後端
      if (liffStateResult.isLoggedIn) {
        addLog("LIFF logged in, getting access token...");
        const accessToken = await getLiffAccessToken();
        addLog("Access token", accessToken ? "obtained" : "null");

        if (accessToken) {
          addLog("Calling backend /auth/liff/login...");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API}/auth/liff/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ accessToken }),
            },
          );

          addLog("Backend response", { status: res.status, ok: res.ok });

          if (res.ok) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      addLog("LIFF login error", error);
      console.error("LIFF login failed:", error);
      return false;
    }
  }, [addLog]);

  /**
   * 檢查 Session 認證
   */
  const checkSessionAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }

      addLog("Checking session...", { api: process.env.NEXT_PUBLIC_API });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });

      addLog("Session check result", { status: res.status, ok: res.ok });
      setSessionStatus(res.ok ? "authenticated" : "not authenticated");
      return res.ok;
    } catch (error) {
      addLog("Session check error", error);
      setSessionStatus("error");
      return false;
    }
  }, [addLog]);

  /**
   * 主要認證流程
   */
  useEffect(() => {
    const checkAuth = async () => {
      addLog("=== Starting auth check ===", { pathname });

      try {
        // 1. 先檢查 session
        addLog("Step 1: Checking existing session...");
        const hasSession = await checkSessionAuth();

        if (hasSession) {
          addLog("✓ Session valid, allowing access");
          setChecked(true);
          return;
        }

        // 2. 如果沒有 session，嘗試 LIFF 登入
        addLog("Step 2: No session, trying LIFF login...");
        const liffLoginSuccess = await tryLiffLogin();
        addLog("LIFF login result", { success: liffLoginSuccess });

        if (liffLoginSuccess) {
          // 再次檢查 session（LIFF 登入成功後應該有 session 了）
          addLog("Step 3: LIFF login succeeded, re-checking session...");
          const hasSessionAfterLiff = await checkSessionAuth();
          if (hasSessionAfterLiff) {
            addLog("✓ Session valid after LIFF login");
            setChecked(true);
            return;
          }
          addLog("✗ Session still invalid after LIFF login");
        }

        // 3. 都失敗，導向登入頁面
        const redirectPath = pathname || "/";
        addLog("✗ Auth failed, redirecting to login", { redirectPath });
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      } catch (err) {
        console.error("Auth check failed:", err);
        addLog("Auth check error", err);
        setAuthError(
          err instanceof Error ? err.message : "Authentication failed",
        );
        const redirectPath = pathname || "/";
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    };

    void checkAuth();
  }, [router, pathname, checkSessionAuth, tryLiffLogin, addLog]);

  if (!checked) {
    // Loading 狀態
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
          {authError && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {authError}
            </p>
          )}
        </div>
        {showDebug && (
          <DebugPanel
            logs={debugLogs}
            liffState={liffState}
            pathname={pathname}
            sessionStatus={sessionStatus}
            checked={checked}
            onHide={() => setShowDebug(false)}
          />
        )}
      </div>
    );
  }

  // 通過驗證，渲染佈局（包含 SidebarContext 和 LiffContext）
  return (
    <LiffProvider>
      <SidebarProvider>
        <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
        {showDebug && (
          <DebugPanel
            logs={debugLogs}
            liffState={liffState}
            pathname={pathname}
            sessionStatus={sessionStatus}
            checked={checked}
            onHide={() => setShowDebug(false)}
          />
        )}
      </SidebarProvider>
    </LiffProvider>
  );
}
