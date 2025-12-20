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
} from "@/lib/liff";

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

  /**
   * 嘗試使用 LIFF Access Token 登入
   */
  const tryLiffLogin = useCallback(async (): Promise<boolean> => {
    if (!isLiffEnabled()) {
      return false;
    }

    try {
      // 初始化 LIFF
      const liffState = await initializeLiff();

      if (!liffState.isInitialized) {
        return false;
      }

      // 如果在 LIFF 內但未登入，觸發 LIFF 登入
      if (liffState.isInClient && !liffState.isLoggedIn) {
        await liffLogin(window.location.href);
        // liffLogin 會重新導向，所以這裡直接返回
        return true;
      }

      // 如果已經登入 LIFF，取得 access token 並送到後端
      if (liffState.isLoggedIn) {
        const accessToken = await getLiffAccessToken();

        if (accessToken) {
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

          if (res.ok) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error("LIFF login failed:", error);
      return false;
    }
  }, []);

  /**
   * 檢查 Session 認證
   */
  const checkSessionAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });

      return res.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * 主要認證流程
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. 先檢查 session
        const hasSession = await checkSessionAuth();

        if (hasSession) {
          setChecked(true);
          return;
        }

        // 2. 如果沒有 session，嘗試 LIFF 登入
        const liffLoginSuccess = await tryLiffLogin();

        if (liffLoginSuccess) {
          // 再次檢查 session（LIFF 登入成功後應該有 session 了）
          const hasSessionAfterLiff = await checkSessionAuth();
          if (hasSessionAfterLiff) {
            setChecked(true);
            return;
          }
        }

        // 3. 都失敗，導向登入頁面
        const redirectPath = pathname || "/";
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      } catch (err) {
        console.error("Auth check failed:", err);
        setAuthError(err instanceof Error ? err.message : "Authentication failed");
        const redirectPath = pathname || "/";
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    };

    void checkAuth();
  }, [router, pathname, checkSessionAuth, tryLiffLogin]);

  if (!checked) {
    // Loading 狀態
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
          {authError && (
            <p className="text-sm text-red-500 dark:text-red-400">{authError}</p>
          )}
        </div>
      </div>
    );
  }

  // 通過驗證，渲染佈局（包含 SidebarContext 和 LiffContext）
  return (
    <LiffProvider>
      <SidebarProvider>
        <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
      </SidebarProvider>
    </LiffProvider>
  );
}
