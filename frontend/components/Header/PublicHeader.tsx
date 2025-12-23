"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import UserMenu from "./UserMenu";
import SettingsMenu from "./SettingsMenu";

/**
 * PublicHeader 元件
 * 用於登入前的公開頁面（landing page, login page 等）
 *
 * 顯示內容：
 * - Logo（左側）
 * - 已登入：Go to App 按鈕 + UserMenu（右側）
 * - 未登入：登入按鈕 + SettingsMenu（右側）
 */
export default function PublicHeader() {
  const t = useTranslations("landing");
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthContext();

  // 檢查是否在登入頁面
  const isLoginPage = pathname?.endsWith("/login");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - 左側固定位置 */}
          <div className="flex items-center gap-2">
            <Logo height={30} href="/" />
          </div>

          {/* 右側：根據登入狀態顯示不同內容 */}
          <div className="flex items-center gap-3 lg:gap-4">
            {user ? (
              // 已登入：Go to App 按鈕 + UserMenu
              <>
                {!isLoginPage && (
                  <button
                    onClick={() => router.push("/joined")}
                    className="px-4 py-2 lg:px-5 lg:py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t("gotoApp")}
                  </button>
                )}
                <UserMenu />
              </>
            ) : (
              // 未登入：登入按鈕 + SettingsMenu
              <>
                {!isLoginPage && (
                  <button
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 lg:px-5 lg:py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t("signIn")}
                  </button>
                )}
                <SettingsMenu />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
