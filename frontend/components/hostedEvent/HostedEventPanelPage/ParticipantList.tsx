"use client";

import { useTranslations } from "next-intl";
import { ParticipantStatusBadge } from "@/components/eventCommon/ParticipantStatusBadge";
import { ParticipantStatus } from "@/types/event";
import Image from "next/image";

interface VotedParticipant {
  userId: string;
  displayName: string;
  hasVoted: boolean;
}

interface PendingParticipant {
  id: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  status: ParticipantStatus;
}

interface VotedParticipantListProps {
  participants: VotedParticipant[];
}

interface PendingParticipantListProps {
  participants: PendingParticipant[];
}

export function VotedParticipantList({
  participants,
}: VotedParticipantListProps) {
  const t = useTranslations("hosted");

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {t("votedParticipants")}
        </h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          ({participants.length})
        </span>
      </div>
      {participants.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
          {t("noVotesYet")}
        </p>
      ) : (
        <ul className="space-y-2">
          {participants.map((participant) => (
            <li
              key={participant.userId}
              className="flex items-center gap-3 py-2"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                {participant.displayName[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {participant.displayName}
              </span>
              <svg
                className="w-4 h-4 text-green-500 ml-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PendingParticipantList({
  participants,
}: PendingParticipantListProps) {
  const t = useTranslations("hosted");

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {t("pendingParticipants")}
        </h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          ({participants.length})
        </span>
      </div>
      {participants.length === 0 ? (
        <AllVotedMessage />
      ) : (
        <ul className="space-y-2">
          {participants.map((participant) => (
            <PendingParticipantItem
              key={participant.id}
              participant={participant}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AllVotedMessage() {
  const t = useTranslations("hosted");

  return (
    <div className="py-4 text-center">
      <svg
        className="w-8 h-8 mx-auto text-green-500 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
        {t("allVoted")}
      </p>
    </div>
  );
}

function PendingParticipantItem({
  participant,
}: {
  participant: PendingParticipant;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      {participant.pictureUrl ? (
        <Image
          src={participant.pictureUrl}
          alt={participant.displayName || ""}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            participant.status === ParticipantStatus.NOT_REGISTERED
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          }`}
        >
          {participant.displayName?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
        {participant.displayName || "Unknown"}
      </span>
      <ParticipantStatusBadge status={participant.status} />
    </li>
  );
}
