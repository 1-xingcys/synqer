"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ExternalLink } from "lucide-react";

interface EventHeaderRowProps {
  title?: string | null;
  managementHref?: string;
}

export function EventHeaderRow({ title, managementHref }: EventHeaderRowProps) {
  const t = useTranslations();

  return (
    <div className="flex items-start justify-between gap-4">
      <h1 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight">
        {title || t("event.untitled")}
      </h1>

      {managementHref && (
        <Link
          href={managementHref}
          className="shrink-0 mt-1 inline-flex items-center justify-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200 dark:hover:bg-sky-900/30 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>{t("eventInfo.goToManagementPage")}</span>
        </Link>
      )}
    </div>
  );
}
