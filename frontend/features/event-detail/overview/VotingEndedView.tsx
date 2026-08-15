"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ClockFading, BarChart3 } from "lucide-react";
import { eventDetailPath } from "@/lib/routing/eventRoutes";

interface VotingEndedViewProps {
  eventId: string;
}

export function VotingEndedView({ eventId }: VotingEndedViewProps) {
  const t = useTranslations("joined");

  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
        <ClockFading className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        {t("votingEnded.title")}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        {t("votingEnded.description")}
      </p>
      <Link
        href={eventDetailPath(eventId, "results")}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <BarChart3 className="w-4 h-4" />
        {t("viewResults")}
      </Link>
    </div>
  );
}
