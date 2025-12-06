"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Sidebar from "@/components/ui/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

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
 * 1. 認證檢查
 * 2. SidebarContext（用於共享 sidebar 狀態）
 * 3. Header（ProtectedHeader）
 * 4. 基本容器結構
 * 
 * 注意：Sidebar 由各個頁面自己管理，因為不同頁面有不同的 sidebar
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API) {
          throw new Error("NEXT_PUBLIC_API is not set");
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API}/auth/me`, {
          credentials: "include", // 讓瀏覽器帶上 backend 的 session cookie
          cache: "no-store",
        });

        if (res.status === 401) {
          // 未登入 → 丟去 login，帶上 redirect
          const redirectPath = pathname || "/";
          router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }

        if (!res.ok) {
          console.error("Unexpected status from /auth/me:", res.status);
          // 發生錯誤當作未登入處理
          const redirectPath = pathname || "/";
          router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }

        // 通過驗證
        setChecked(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        const redirectPath = pathname || "/";
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    };

    void checkAuth();
  }, [router, pathname]);

  if (!checked) {
    // Loading 狀態
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
      </div>
    );
  }

  // 通過驗證，渲染佈局（包含 SidebarContext）
  return (
    <SidebarProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarProvider>
  );
}
