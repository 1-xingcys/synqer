"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventShareLink } from "@/hooks/useEventShareLink";

export function InviteLink() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const { shareUrl, copied, copyLink } = useEventShareLink(eventId);

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t("hosted.settingsPage.inviteLink.title")}
      </h2>

      <hr className="my-2 border-t border-gray-300" />

      <div className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-3 pr-1 py-1 my-4">
        <div className="relative flex-1 min-w-0 overflow-hidden">
          <div className="whitespace-nowrap py-1 text-sm text-zinc-700 dark:text-zinc-300">
            {shareUrl}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-800" />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void copyLink()}
          aria-label={t("hosted.settingsPage.inviteLink.copy")}
          className="shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </section>
  );
}
