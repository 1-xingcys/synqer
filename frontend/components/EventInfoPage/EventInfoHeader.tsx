"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import Image from "next/image";
import { ArrowLeft, User } from "lucide-react";
import { TransitionLink } from "@/components/ui/TransitionLink";

interface EventHost {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface EventInfoHeaderProps {
  eventId: string;
  title?: string;
  host: EventHost | null;
  createdAt: string;
}

export function EventInfoHeader({
  eventId,
  title,
  host,
  createdAt,
}: EventInfoHeaderProps) {
  const t = useTranslations();

  return (
    <div className="mb-8">
      <TransitionLink
        href={`/joined/${eventId}`}
        direction="back"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("joined.backToEvent")}
      </TransitionLink>

      <div className="flex flex-col gap-2.5 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
          {title || t("event.untitled")}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          <span>{t("eventInfo.createdBy")}</span>
          <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            {host?.avatarUrl ? (
              <Image
                src={host.avatarUrl}
                alt={host.displayName || ""}
                width={18}
                height={18}
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full"
              />
            ) : (
              <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-500" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {host?.displayName || t("joinedEvents.unknownHost")}
            </span>
          </div>
          <span>{t("eventInfo.createdOn")}</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {format(new Date(createdAt), "yyyy/MM/dd HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}
