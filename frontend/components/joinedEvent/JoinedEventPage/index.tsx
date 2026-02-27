"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventStatus } from "@/types/event";
import { EventInfoDetail } from "@/components/EventInfoPage/EventInfoDetail";
import { VotingEndedView } from "./VotingEndedView";
import { ConfirmedView } from "./ConfirmedView";
import { CompletedView } from "./CompletedView";
import JoinedEventStatusPage from "@/components/joinedEvent/JoinedEventStatusPage";

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

  if (isVoting) return <JoinedEventStatusPage />;

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
            confirmedTimeRanges={event.confirmedTimeRanges}
          />
        )}

        {event.status === EventStatus.COMPLETED && (
          <CompletedView confirmedTimeRanges={event.confirmedTimeRanges} />
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6">
        <EventInfoDetail
          status={event.status}
          startDate={event.startDate}
          endDate={event.endDate}
          startMinuteOfDay={event.startMinuteOfDay}
          endMinuteOfDay={event.endMinuteOfDay}
          votingDeadline={event.votingDeadline}
          currentUserHasVoted={currentUserHasVoted}
          showTitle={false}
          embedded
        />
      </div>
    </div>
  );
}
