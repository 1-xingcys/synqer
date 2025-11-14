"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
      <button
        onClick={() => handleLocaleChange("zh-TW")}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          currentLocale === "zh-TW"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        繁體中文
      </button>
      <button
        onClick={() => handleLocaleChange("en")}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          currentLocale === "en"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        English
      </button>
    </div>
  );
}
