"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/ui/badge";
import { ParticipantItem } from "./types";

interface ParticipantCardProps {
  participant: ParticipantItem;
  labels: {
    voted: string;
    notVoted: string;
  };
}

export function ParticipantCard({ participant, labels }: ParticipantCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center gap-3">
      {participant.pictureUrl ? (
        <Image
          src={participant.pictureUrl}
          alt={participant.displayName}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full shrink-0"
        />
      ) : (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
            participant.hasVoted
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {participant.displayName[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate">
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
