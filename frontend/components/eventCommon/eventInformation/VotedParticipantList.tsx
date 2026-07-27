"use client";

import { useTranslations } from "next-intl";
import { CheckCheck } from "lucide-react";
import type { EventInformationParticipant } from "./types";
import { ParticipantItem } from "./ParticipantItem";

interface VotedParticipantListProps {
  participants: EventInformationParticipant[];
  currentUserId?: string;
  getDisplayInfo: (p: EventInformationParticipant) => {
    displayName: string;
    avatarUrl?: string;
  };
}

export function VotedParticipantList({
  participants,
  currentUserId,
  getDisplayInfo,
}: VotedParticipantListProps) {
  const t = useTranslations();

  if (participants.length === 0) return null;

  return (
    <div className="my-2 sm:my-4">
      <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <CheckCheck className="w-3.5 h-3.5" />
          {t("participantStatus.voted")}
        </span>
        <span>{participants.length}</span>
      </h3>
      <ul>
        {participants.map((participant) => {
          const { displayName, avatarUrl } = getDisplayInfo(participant);
          const isCurrentUser =
            !!currentUserId &&
            (participant.userId === currentUserId ||
              participant.user?.id === currentUserId);

          return (
            <ParticipantItem
              key={participant.id}
              displayName={displayName}
              avatarUrl={avatarUrl}
              isCurrentUser={isCurrentUser}
              hasVoted={true}
            />
          );
        })}
      </ul>
    </div>
  );
}
