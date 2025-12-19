"use client";

import type { ReactNode } from "react";
import UserMenu from "@/components/Header/UserMenu";
import Logo from "@/components/Logo";

interface ProtectedHeaderProps {
  children?: ReactNode;
  onMenuClick?: () => void;
}

/**
 * ProtectedHeader 元件
 * 用於登入後的受保護頁面（dashboard, events 等）
 *
 * 顯示內容：
 * - 漢堡按鈕（左側，用於打開 Sidebar）
 * - Logo（左側，在漢堡按鈕右邊）
 * - 中間內容（可選，通過 children 傳入）
 * - UserMenu（右側，使用者頭像 + 下拉選單）
 */
export default function ProtectedHeader({
  children,
  onMenuClick,
}: ProtectedHeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
      <div className="w-full pl-3 pr-4 py-2">
        <div className="flex items-center justify-between">
          {/* 左側：漢堡按鈕 + Logo */}
          <div className="flex items-center gap-2">
            {/* 漢堡按鈕 - 用於打開 Sidebar */}
            <button
              onClick={onMenuClick}
              className="px-4 py-2 mr-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {/* Logo - 位置與 PublicHeader 對齊 */}
            <Logo height={40} href="/joined" />
          </div>

          {/* 中間內容（可選） */}
          <div className="flex items-center gap-4">
            {children || <div className="w-8 h-8" />}
          </div>

          {/* 右側：使用者選單 */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
