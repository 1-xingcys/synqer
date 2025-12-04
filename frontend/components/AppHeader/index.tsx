"use client";

import type { ReactNode } from "react";
import UserMenu from "@/components/AppHeader/UserMenu";
import Logo from "@/components/Logo";

interface AppHeaderProps {
  children?: ReactNode;
  onMenuClick?: () => void;
}

export default function AppHeader({ children, onMenuClick }: AppHeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 漢堡按鈕 */}
            <div className="lg:w-16 lg:flex lg:justify-center">
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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
            </div>
            <Logo height={40} href="/dashboard" />
          </div>

          <div className="flex items-center gap-4">
            {children || <div className="w-8 h-8" />}
          </div>

          {/* 右側使用者選單 */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
