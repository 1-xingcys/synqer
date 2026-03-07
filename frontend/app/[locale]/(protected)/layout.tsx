"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import Header from "@/components/Header";
import Sidebar from "@/components/ui/Sidebar";
import { LoadingState } from "@/components/ui/loading-state";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useAuthContext } from "@/contexts/AuthContext";

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
 * 為所有受保護的頁面提供統一的佈局結構。
 * 認證狀態由全域 AuthProvider 單一管理，這裡僅做導頁與渲染控制。
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      const redirectPath = pathname || "/";
      router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <LoadingState
        viewport="screen"
        background="muted"
        spinnerTone="neutral"
      />
    );
  }

  // 通過驗證，渲染佈局
  return (
    <SidebarProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarProvider>
  );
}
