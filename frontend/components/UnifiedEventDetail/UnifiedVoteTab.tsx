"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { EventStatus } from "@/types/event";
import VotingGrid from "@/components/eventCommon/timeGrid/VotingGrid";
import { VotingInstruction } from "@/components/joinedEvent/JoinedEventPage/StatusDescription";

export default function UnifiedVoteTab() {
  const params = useParams();
  const eventId = params.eventId as string;
  const tJoined = useTranslations("joined");
  const { user } = useAuthContext();
  const { data } = useJoinedEventContext();

  if (!data || !user) return null;
  if (data.event.status !== EventStatus.VOTING) return null;

  // TODO: 加上 useEffect 監聽 event status，若非 voting 狀態則導回 JoinedEventPage
  const currentUserHasVoted = data.expectedParticipants.some(
    (participant) =>
      (participant.userId === user.id.toString() ||
        participant.user?.id === user.id.toString()) &&
      participant.hasVoted,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <VotingInstruction />
      <VotingGrid
        slots={data.slots}
        votes={data.votes}
        stagedVote={data.stagedVote}
        currentUserHasVoted={currentUserHasVoted}
        currentUserId={user.id.toString()}
        eventId={eventId}
        eventTitle={data.event.title || tJoined("untitledEvent")}
        timeZone={data.event.timeZone}
        capabilities={data.event.capabilities}
      />
    </div>
  );
}
