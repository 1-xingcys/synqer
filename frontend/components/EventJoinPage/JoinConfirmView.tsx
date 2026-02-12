"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  Loader2,
  UserPlus,
  User,
  Hourglass,
} from "lucide-react";
import { formatMinutesToTime } from "@/lib/utils";
import { EventPublicInfo } from "./useEventJoin";

interface JoinConfirmViewProps {
  eventInfo: EventPublicInfo;
  joining: boolean;
  onJoin: () => void;
}

export function JoinConfirmView({
  eventInfo,
  joining,
  onJoin,
}: JoinConfirmViewProps) {
  const t = useTranslations();

  return (
    <div className="min-h-[60vh] py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("eventJoin.youAreInvited")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 break-words">
            {eventInfo.title || t("event.untitled")}
          </h1>
          <div className="inline-flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{t("eventInfo.createdBy")}</span>
            <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-full">
              {eventInfo.host?.avatarUrl ? (
                <Image
                  src={eventInfo.host.avatarUrl}
                  alt={eventInfo.host.displayName || ""}
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] rounded-full"
                />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <User className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                </div>
              )}
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {eventInfo.host?.displayName || t("joinedEvents.unknownHost")}
              </span>
            </div>
            {eventInfo.createdAt && (
              <>
                <span>{t("eventInfo.createdOn")}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {format(new Date(eventInfo.createdAt), "yyyy/MM/dd HH:mm")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl py-4 px-4 sm:py-5 sm:px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3 sm:mb-4 flex items-center gap-2">
            {t("eventInfo.candidateInfo")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("eventJoin.votingDateRange")}
                </span>
              </div>
              <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-5 sm:pl-6">
                {format(new Date(eventInfo.startDate), "yyyy/MM/dd")}
                <span className="mx-2 text-zinc-400">~</span>
                {format(new Date(eventInfo.endDate), "yyyy/MM/dd")}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                <Clock3 className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("eventInfo.candidateTime")}
                </span>
              </div>
              <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-5 sm:pl-6">
                {typeof eventInfo.startMinuteOfDay === "number" &&
                typeof eventInfo.endMinuteOfDay === "number"
                  ? `${formatMinutesToTime(eventInfo.startMinuteOfDay)} ~ ${formatMinutesToTime(eventInfo.endMinuteOfDay)}`
                  : "-"}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                <Hourglass className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {t("eventInfo.votingDeadline")}
                </span>
              </div>
              <p className="text-sm sm:text-base font-mono text-zinc-900 dark:text-zinc-100 pl-5 sm:pl-6">
                {eventInfo.votingDeadline
                  ? format(
                      new Date(eventInfo.votingDeadline),
                      "yyyy/MM/dd HH:mm",
                    )
                  : t("eventInfo.noDeadline")}
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm sm:text-base bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-5">
          <div className="flex gap-3">
            <Link
              href="/joined"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              {t("eventJoin.cancel")}
            </Link>
            <button
              onClick={onJoin}
              disabled={joining}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("eventJoin.joining")}
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  {t("eventJoin.joinEvent")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
