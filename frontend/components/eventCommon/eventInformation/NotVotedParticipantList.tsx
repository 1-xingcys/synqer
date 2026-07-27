"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import type { EventInformationParticipant } from "./types";
import { ParticipantItem } from "./ParticipantItem";

interface NotVotedParticipantListProps {
  participants: EventInformationParticipant[];
  currentUserId?: string;
  getDisplayInfo: (p: EventInformationParticipant) => {
    displayName: string;
    avatarUrl?: string;
  };
}

export function NotVotedParticipantList({
  participants,
  currentUserId,
  getDisplayInfo,
}: NotVotedParticipantListProps) {
  const t = useTranslations();

  if (participants.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {t("participantStatus.notVoted")}
        </span>
        <span>{participants.length}</span>
      </h3>
      <ul className="space-y-3">
        {participants.map((participant) => {
          const { displayName, avatarUrl } = getDisplayInfo(participant);
          const isCurrentUser =
            !!currentUserId &&
            (participant.userId === currentUserId ||
              participant.user?.id === currentUserId);
          const isNotRegistered = !participant.userId && !participant.user;

          return (
            <ParticipantItem
              key={participant.id}
              displayName={displayName}
              avatarUrl={avatarUrl}
              isCurrentUser={isCurrentUser}
              hasVoted={false}
              isNotRegistered={isNotRegistered}
            />
          );
        })}
      </ul>
    </div>
  );
}
