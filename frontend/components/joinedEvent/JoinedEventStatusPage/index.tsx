"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventInfoDetail } from "@/components/EventInfoPage/EventInfoDetail";
import { EventInfoParticipants } from "@/components/EventInfoPage/EventInfoParticipants";
import type { ExpectedParticipant as EventInfoExpectedParticipant } from "@/components/EventInfoPage/hooks/useEventInfo";

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
  const participantsForInfoCard: EventInfoExpectedParticipant[] =
    expectedParticipants.map((participant) => {
      const status: EventInfoExpectedParticipant["status"] =
        participant.hasVoted
          ? "VOTED"
          : participant.userId || participant.user
            ? "NOT_VOTED"
            : "NOT_REGISTERED";

      return {
        id: participant.id,
        lineUserId: participant.lineUserId ?? undefined,
        userId: participant.userId ?? undefined,
        hasVoted: participant.hasVoted,
        status,
        user: participant.user
          ? {
              id: participant.user.id,
              displayName: participant.user.displayName,
              avatarUrl: participant.user.avatarUrl,
            }
          : undefined,
        displayName: participant.user?.displayName ?? undefined,
        pictureUrl: participant.user?.avatarUrl ?? undefined,
      };
    });

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
            showTitle={false}
          />
        </div>
      </div>

      <div className="lg:col-span-1">
        <EventInfoParticipants
          expectedParticipants={participantsForInfoCard}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
