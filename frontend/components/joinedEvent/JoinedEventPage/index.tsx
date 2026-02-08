"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventStatus } from "@/types/event";
import VotingGrid from "@/components/eventCommon/timeGrid/VotingGrid";
import { VotingEndedView } from "./VotingEndedView";
import { ConfirmedView } from "./ConfirmedView";
import { CompletedView } from "./CompletedView";
import { VotingInstruction } from "./StatusDescription";

export default function JoinedEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const tJoined = useTranslations("joined");
  const { user } = useAuthContext();
  const { data: eventDetailData } = useJoinedEventContext();

  // Loading and error states are handled by the layout
  if (!eventDetailData) {
    return null;
  }

  const { event } = eventDetailData;
  const isVoting = event.status === EventStatus.VOTING;

  if (isVoting && user) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <VotingInstruction />
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 p-2 sm:p-6">
          <VotingGrid
            slots={eventDetailData.slots}
            votes={eventDetailData.votes}
            currentUserId={user.id.toString()}
            currentUserDisplayName={user.displayName || ""}
            eventId={eventId}
          />
        </div>
      </div>
    );
  }

  return (
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
  );
}
