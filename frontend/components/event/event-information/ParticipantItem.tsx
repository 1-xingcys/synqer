"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { CheckCheck, User } from "lucide-react";

interface ParticipantItemProps {
  displayName: string;
  avatarUrl?: string;
  isCurrentUser: boolean;
  hasVoted: boolean;
  isNotRegistered?: boolean;
}

export function ParticipantItem({
  displayName,
  avatarUrl,
  isCurrentUser,
  hasVoted,
  isNotRegistered,
}: ParticipantItemProps) {
  const t = useTranslations();

  return (
    <li
      className={`flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors -mx-2 ${
        !hasVoted ? "opacity-80 hover:opacity-100" : ""
      }`}
    >
      <div className="relative shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className={`w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 ${
              !hasVoted ? "grayscale" : ""
            }`}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
            <User className="w-4 h-4 text-zinc-400" />
          </div>
        )}
        {hasVoted && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5 border-2 border-white dark:border-zinc-900">
            <CheckCheck className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            hasVoted
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {displayName}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs text-zinc-400 font-normal">
              ({t("eventInfo.you")})
            </span>
          )}
        </p>
        {isNotRegistered && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("participantStatus.notRegistered")}
          </p>
        )}
      </div>
    </li>
  );
}
