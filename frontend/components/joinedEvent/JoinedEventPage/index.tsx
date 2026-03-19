"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventStatus, supportsAddToCalendar } from "@/types/event";
import { EventInfoDetail } from "@/components/joinedEvent/eventInformation/EventInfoDetail";
import { EventInfoParticipants } from "@/components/joinedEvent/eventInformation/EventInfoParticipants";
import { VotingEndedView } from "./VotingEndedView";
import { ConfirmedView } from "./ConfirmedView";
import { CompletedView } from "./CompletedView";

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

  const currentUserHasVoted = eventDetailData.expectedParticipants.some(
    (participant) =>
      (participant.userId === user?.id.toString() ||
        participant.user?.id === user?.id.toString()) &&
      participant.hasVoted,
  );
  const currentUserId = user?.id?.toString();

  if (isVoting) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 sm:py-5 sm:px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <EventInfoDetail
              eventType={event.type}
              status={event.status}
              schedule={event.schedule}
              votingDeadline={event.votingDeadline}
              currentUserHasVoted={currentUserHasVoted}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <EventInfoParticipants
            expectedParticipants={eventDetailData.expectedParticipants}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {event.status === EventStatus.VOTING_ENDED && (
          <VotingEndedView eventId={eventId} />
        )}

        {event.status === EventStatus.CONFIRMED && (
          <ConfirmedView
            eventTitle={event.title || tJoined("untitledEvent")}
            eventDescription={event.description}
            confirmedSelections={event.confirmedSelections}
            supportsAddToCalendar={supportsAddToCalendar(event)}
          />
        )}

        {event.status === EventStatus.COMPLETED && (
          <CompletedView confirmedSelections={event.confirmedSelections} />
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6">
        <EventInfoDetail
          eventType={event.type}
          status={event.status}
          schedule={event.schedule}
          votingDeadline={event.votingDeadline}
          currentUserHasVoted={currentUserHasVoted}
        />
      </div>
    </div>
  );
}
