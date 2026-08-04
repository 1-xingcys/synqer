"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventDetail } from "@/hooks/useEventDetail";
import { EventStatus } from "@/types/event";
import {
  normalizeGranularity,
  normalizeShareVoteToChat,
  toVoteMode,
} from "@/lib/eventPreference";
import VotingGrid from "@/features/time-grid/VotingGrid";
import { Text } from "@/components/ui/text";

export default function UnifiedVoteTab() {
  const params = useParams();
  const eventId = params.eventId as string;
  const tJoined = useTranslations("joined");
  const { user } = useAuthContext();
  const { data } = useEventDetail(eventId);

  if (!data || !user) return null;
  if (data.event.status !== EventStatus.VOTING) return null;

  const currentUserHasVoted = data.expectedParticipants.some(
    (participant) =>
      (participant.userId === user.id.toString() ||
        participant.user?.id === user.id.toString()) &&
      participant.hasVoted,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <Text variant="hint" align="center">
        {data.event.votingDeadline
          ? tJoined("votingInstructionDeadline")
          : tJoined("votingInstruction")}
      </Text>
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
        defaultGranularity={normalizeGranularity(
          data.event.defaultGranularityMin,
        )}
        defaultVoteMode={toVoteMode(data.event.defaultVoteMode)}
        shareVoteToChat={normalizeShareVoteToChat(data.event.shareVoteToChat)}
      />
    </div>
  );
}
