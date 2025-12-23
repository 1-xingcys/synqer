"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
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
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface LanguageSwitcherProps {
  asSubmenu?: boolean;
  variant?: "default" | "footer";
}

export default function LanguageSwitcher({
  asSubmenu = false,
  variant = "default",
}: LanguageSwitcherProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const languages = [
    { code: "zh-TW", label: "繁體中文" },
    { code: "en", label: "English" },
  ];

  const languageItems = languages.map((lang) => (
    <DropdownMenuItem
      key={lang.code}
      onClick={() => handleLocaleChange(lang.code)}
      className="cursor-pointer"
    >
      {currentLocale === lang.code && <CheckIcon className="mr-2 h-4 w-4" />}
      <span className={currentLocale !== lang.code ? "ml-6" : ""}>
        {lang.label}
      </span>
    </DropdownMenuItem>
  ));

  if (asSubmenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <LanguagesIcon className="mr-2 h-4 w-4" />
          {t("language")}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>{languageItems}</DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  const buttonClassName =
    variant === "footer"
      ? "inline-flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-2 text-sm font-medium text-white transition"
      : "inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={buttonClassName}>
          {variant !== "footer" && <LanguagesIcon className="h-4 w-4" />}
          <span>{currentLocale === "zh-TW" ? "繁體中文" : "English"}</span>
          {variant === "footer" && (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <LanguagesIcon className="h-4 w-4" />
          {t("language")}
        </DropdownMenuLabel>
        {languageItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
