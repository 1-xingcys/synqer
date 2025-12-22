"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/ui/badge";
import { ParticipantItem } from "./types";

interface ParticipantListItemProps {
  participant: ParticipantItem;
  labels: {
    voted: string;
    notVoted: string;
  };
}

export function ParticipantListItem({
  participant,
  labels,
}: ParticipantListItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
      {participant.pictureUrl ? (
        <Image
          src={participant.pictureUrl}
          alt={participant.displayName}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            participant.hasVoted
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {participant.displayName[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {participant.displayName}
        </div>
      </div>
      <StatusBadge
        variant={participant.hasVoted ? "voted" : "notVoted"}
        label={participant.hasVoted ? labels.voted : labels.notVoted}
      />
    </div>
  );
}
