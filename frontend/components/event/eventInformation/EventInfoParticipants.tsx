"use client";

import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import type { EventInformationParticipant } from "./types";
import { VotedParticipantList } from "./VotedParticipantList";
import { NotVotedParticipantList } from "./NotVotedParticipantList";

interface EventInfoParticipantsProps {
  expectedParticipants: EventInformationParticipant[];
  currentUserId?: string;
}

/**
 * Read-only view of who is expected at an event and who has voted so far.
 */
export function EventInfoParticipants({
  expectedParticipants,
  currentUserId,
}: EventInfoParticipantsProps) {
  const t = useTranslations();

  // Get participant display info
  const getParticipantDisplayInfo = (p: EventInformationParticipant) => {
    const displayName = p.user?.displayName || t("joinedEvents.unknownHost");
    const avatarUrl = p.user?.avatarUrl || undefined;
    return { displayName, avatarUrl };
  };

  // Separate voted and not voted participants
  const votedParticipants = expectedParticipants.filter((p) => p.hasVoted);
  const notVotedParticipants = expectedParticipants.filter((p) => !p.hasVoted);

  return (
    <>
      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3 sm:mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("eventInfo.participantsStatus")}
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs px-2 py-1 rounded-full font-medium">
          {expectedParticipants.length}
        </span>
      </h2>

      {expectedParticipants.length === 0 ? (
        <div className="text-center py-5 text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          {t("joinedParticipants.noParticipants")}
        </div>
      ) : (
        <div className="space-y-5">
          <VotedParticipantList
            participants={votedParticipants}
            currentUserId={currentUserId}
            getDisplayInfo={getParticipantDisplayInfo}
          />

          {/* Divider if both exist */}
          {votedParticipants.length > 0 && notVotedParticipants.length > 0 && (
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3 sm:my-4" />
          )}

          <NotVotedParticipantList
            participants={notVotedParticipants}
            currentUserId={currentUserId}
            getDisplayInfo={getParticipantDisplayInfo}
          />
        </div>
      )}
    </>
  );
}
