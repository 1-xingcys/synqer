"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { BackButton } from "@/components/ui/BackButton";

interface DeletedEventViewProps {
  /** 返回連結的路徑 */
  backHref: string;
  /** 返回按鈕的文字 */
  backLabel: string;
  /** 翻譯 key 的前綴，用於取得 eventDeleted 和 eventDeletedDescription */
  translationPrefix: string;
  /** 是否顯示返回首頁按鈕 */
  showHomeButton?: boolean;
}

export function DeletedEventView({
  backHref,
  backLabel,
  translationPrefix,
  showHomeButton = false,
}: DeletedEventViewProps) {
  const t = useTranslations();

  return (
    <div className="py-8">
      <BackButton href={backHref} label={backLabel} />
      <div className="flex items-center justify-center min-h-[40vh] mt-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {t(`${translationPrefix}.eventDeleted`)}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {t(`${translationPrefix}.eventDeletedDescription`)}
          </p>
          {showHomeButton && (
            <Link
              href="/joined"
              className="inline-flex items-center gap-2 px-4 py-2 mt-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {t("event.backToDashboard")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
