"use client";

import { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import { cn } from "@/lib/utils";

/**
 * ProtectedPageLayout Props
 */
interface ProtectedPageLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  showHeader?: boolean;
  onMenuClick?: () => void;
  contentClassName?: string;
  containerClassName?: string;
}

/**
 * ProtectedPageLayout 元件
 * 為受保護的頁面提供統一的佈局結構
 *
 * 特點：
 * 1. 統一的 header + sidebar + content 佈局
 * 2. 保持內容區域固定最大寬度
 * 3. 響應式設計
 * 4. 可選的 sidebar
 */
export default function ProtectedPageLayout({
  children,
  sidebar,
  showHeader = true,
  onMenuClick,
  contentClassName,
  containerClassName,
}: ProtectedPageLayoutProps) {
  const containerBase =
    "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 items-start";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Header with hamburger button */}
      {showHeader && <AppHeader onMenuClick={onMenuClick} />}

      {/* Sidebar + Content */}
      <div className={cn(containerBase, containerClassName)}>
        {sidebar}

        {/* Main Content - 固定最大寬度，居中顯示 */}
        <div className="flex-1 min-w-0">
          <main className={contentClassName}>{children}</main>
        </div>
      </div>
    </div>
  );
}
