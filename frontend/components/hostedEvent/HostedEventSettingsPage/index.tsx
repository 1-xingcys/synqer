"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventShareLink } from "@/hooks/useEventShareLink";
import { VotingDeadline } from "./VotingDeadline";
import { DangerZone } from "./DangerZone";

export default function HostedEventSettingsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();

  const { shareUrl, copied: linkCopied, copyLink } = useEventShareLink(eventId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Invite Link Section */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("hosted.settingsPage.inviteLink.title")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t("hosted.settingsPage.inviteLink.description")}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-3 pr-1 py-1">
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
              {linkCopied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <VotingDeadline />

      <DangerZone />
    </div>
  );
}
