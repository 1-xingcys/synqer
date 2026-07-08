"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { eventDetailPath } from "@/lib/eventRoutes";

interface AlreadyParticipantViewProps {
  eventId: string;
  eventTitle: string | null;
}

export function AlreadyParticipantView({
  eventId,
  eventTitle,
}: AlreadyParticipantViewProps) {
  const t = useTranslations();

  return (
    <div className="min-h-[60vh] py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-50 break-words">
            {eventTitle || t("event.untitled")}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            {t("eventJoin.alreadyParticipantDescription")}
          </p>

          <Link
            href={eventDetailPath(eventId)}
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            {t("eventJoin.goToVote")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
