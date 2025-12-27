"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { SelectedParticipant } from "../types";

interface ReadOnlyParticipantsViewProps {
  selectedParticipants: SelectedParticipant[];
  isHost: (userId?: string) => boolean;
}

export function ReadOnlyParticipantsView({
  selectedParticipants,
  isHost,
}: ReadOnlyParticipantsViewProps) {
  const t = useTranslations();

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {t("hosted.participantsPage.participants")}
          </h3>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ({selectedParticipants.length})
          </span>
        </div>

        <div className="p-4">
          {selectedParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
              {t("hosted.participantsPage.noParticipants")}
            </p>
          ) : (
            <div className="space-y-1">
              {selectedParticipants.map((participant, index) => (
                <div
                  key={`${participant.lineUserId || participant.userId || index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                    {participant.pictureUrl ? (
                      <Image
                        width={40}
                        height={40}
                        src={participant.pictureUrl}
                        alt={participant.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                        {participant.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {participant.displayName}
                      {isHost(participant.userId) && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          ({t("hosted.participantsPage.host")})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Voted status */}
                  {participant.hasVoted && (
                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      {t("hosted.participantsPage.voted")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
