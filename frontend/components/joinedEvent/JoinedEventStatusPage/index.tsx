"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventInfoDetail } from "@/components/joinedEvent/eventInformation/EventInfoDetail";
import { EventInfoParticipants } from "@/components/joinedEvent/eventInformation/EventInfoParticipants";

export default function JoinedEventStatusPage() {
  const { user } = useAuthContext();
  const { data } = useJoinedEventContext();

  if (!data) return null;

  const { event, expectedParticipants } = data;
  const currentUserId = user?.id?.toString();
  const currentUserHasVoted = expectedParticipants.some(
    (participant) =>
      (participant.userId === currentUserId ||
        participant.user?.id === currentUserId) &&
      participant.hasVoted,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 sm:py-5 sm:px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <EventInfoDetail
            status={event.status}
            startDate={event.startDate}
            endDate={event.endDate}
            startMinuteOfDay={event.startMinuteOfDay}
            endMinuteOfDay={event.endMinuteOfDay}
            votingDeadline={event.votingDeadline}
            currentUserHasVoted={currentUserHasVoted}
          />
        </div>
      </div>

      <div className="lg:col-span-1">
        <EventInfoParticipants
          expectedParticipants={expectedParticipants}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
