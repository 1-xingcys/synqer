"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";

export default function Navbar() {
  const t = useTranslations("landing");
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthContext();
  
  // 檢查是否在登入頁面
  const isLoginPage = pathname?.endsWith("/login");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo height={40} href="/" />
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {!isLoginPage && (
              user ? (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("gotoDashboard")}
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("signIn")}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

