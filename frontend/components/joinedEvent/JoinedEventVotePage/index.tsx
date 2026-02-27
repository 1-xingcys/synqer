"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventStatus } from "@/types/event";
import VotingGrid from "@/components/eventCommon/timeGrid/VotingGrid";
import { VotingInstruction } from "@/components/joinedEvent/JoinedEventPage/StatusDescription";

export default function JoinedEventVotePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const tJoined = useTranslations("joined");
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: eventDetailData } = useJoinedEventContext();

  const hasDataAndUser = Boolean(eventDetailData && user);
  const isVoting = eventDetailData?.event.status === EventStatus.VOTING;

  useEffect(() => {
    if (hasDataAndUser && !isVoting) {
      router.replace(`/joined/${eventId}`);
    }
  }, [eventId, hasDataAndUser, isVoting, router]);

  if (!eventDetailData || !user) return null;
  if (!isVoting) return null;

  const currentUserHasVoted = eventDetailData.expectedParticipants.some(
    (participant) =>
      (participant.userId === user.id.toString() ||
        participant.user?.id === user.id.toString()) &&
      participant.hasVoted,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <VotingInstruction />
      <VotingGrid
        slots={eventDetailData.slots}
        votes={eventDetailData.votes}
        stagedVote={eventDetailData.stagedVote}
        currentUserHasVoted={currentUserHasVoted}
        currentUserId={user.id.toString()}
        eventId={eventId}
        eventTitle={eventDetailData.event.title || tJoined("untitledEvent")}
      />
    </div>
  );
}
