"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventStatus } from "@/types/event";
import VotingGrid from "@/components/eventCommon/timeGrid";
import { VotingEndedView } from "./VotingEndedView";
import { ConfirmedView } from "./ConfirmedView";
import { CompletedView } from "./CompletedView";
import { StatusDescription } from "./StatusDescription";

export default function JoinedEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const tJoined = useTranslations("joined");
  const { user } = useAuthContext();
  const { data: eventDetailData, saveVotes } = useJoinedEventContext();

  // Loading and error states are handled by the layout
  if (!eventDetailData) {
    return null;
  }

  // Check if voting is allowed (only during VOTING status)
  const canVote = eventDetailData.event.status === EventStatus.VOTING;

  // Get current user's voted slot IDs
  const currentUserVotes: string[] = user
    ? eventDetailData.votes
        .filter((vote) => vote.userId === user.id.toString())
        .map((vote) => vote.slotId)
    : [];

  const { event } = eventDetailData;

  return (
    <div className="space-y-6">
      {/* Status Description */}
      <StatusDescription status={event.status} />

      {/* Voting Grid - only shown during VOTING status */}
      {canVote && (
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 p-2 sm:p-6">
          <VotingGrid
            slots={eventDetailData.slots}
            votes={eventDetailData.votes}
            participants={eventDetailData.participants}
            onSave={saveVotes}
            initialSelectedIds={currentUserVotes}
            currentUserId={user?.id?.toString()}
            eventId={eventId}
          />
        </div>
      )}

      {/* Non-voting states */}
      {!canVote && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {event.status === EventStatus.VOTING_ENDED && (
            <VotingEndedView eventId={eventId} />
          )}

          {event.status === EventStatus.CONFIRMED && (
            <ConfirmedView
              eventTitle={event.title || tJoined("untitledEvent")}
              eventDescription={event.description}
              confirmedTimeRanges={event.confirmedTimeRanges}
            />
          )}

          {event.status === EventStatus.COMPLETED && (
            <CompletedView confirmedTimeRanges={event.confirmedTimeRanges} />
          )}
        </div>
      )}
    </div>
  );
}
