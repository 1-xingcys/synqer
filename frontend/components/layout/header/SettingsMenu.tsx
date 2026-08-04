"use client";

import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { SettingsIcon } from "lucide-react";

/**
 * SettingsMenu 元件
 * 用於未登入使用者的設定選單（語言和主題）
 */
export default function SettingsMenu() {
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={t("settings")}
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <LanguageSwitcher asSubmenu />
        <DropdownMenuSeparator />
        <ThemeSwitcher asSubmenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
