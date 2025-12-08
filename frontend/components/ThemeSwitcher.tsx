"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ThemeSwitcherProps {
  asSubmenu?: boolean;
}

export default function ThemeSwitcher({
  asSubmenu = false,
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();

  // 避免 hydration mismatch - 在組件掛載後才顯示主題選擇器
  useEffect(() => {
    // 使用 setTimeout 避免在 effect 中直接調用 setState
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    { value: "light", label: t("theme.light"), icon: SunIcon },
    { value: "dark", label: t("theme.dark"), icon: MoonIcon },
    { value: "system", label: t("theme.system"), icon: MonitorIcon },
  ];

  const themeItems = themes.map((themeOption) => {
    const Icon = themeOption.icon;
    return (
      <DropdownMenuItem
        key={themeOption.value}
        onClick={() => setTheme(themeOption.value)}
        className="cursor-pointer"
      >
        {theme === themeOption.value && <CheckIcon className="mr-2 h-4 w-4" />}
        <Icon className="mr-2 h-4 w-4" />
        <span className={theme !== themeOption.value ? "ml-6" : ""}>
          {themeOption.label}
        </span>
      </DropdownMenuItem>
    );
  });

  if (asSubmenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <MonitorIcon className="mr-2 h-4 w-4" />
          {t("theme.title")}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>{themeItems}</DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <MonitorIcon className="h-4 w-4" />
          <span>
            {theme === "light"
              ? t("theme.light")
              : theme === "dark"
                ? t("theme.dark")
                : t("theme.system")}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <MonitorIcon className="h-4 w-4" />
          {t("theme.title")}
        </DropdownMenuLabel>
        {themeItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
