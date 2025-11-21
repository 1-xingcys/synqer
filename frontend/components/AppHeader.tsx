"use client";

import UserMenu from "@/components/UserMenu";
import Logo from "@/components/Logo";

interface AppHeaderProps {
  children?: React.ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Logo height={40} href="/dashboard" />
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
