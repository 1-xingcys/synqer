"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventDetail } from "@/hooks/useEventDetail";
import VotingGrid from "@/components/JoinedEventPage/VotingGrid";
import { EventInfoCompact } from "@/components/eventCommon/EventInfoCompact";

export default function JoinedEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const router = useRouter();
  const { user } = useAuthContext();

  const {
    data: eventDetailData,
    loading,
    error,
    saveVotes,
  } = useEventDetail(eventId);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !eventDetailData) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-lg text-red-600 dark:text-red-400">
            {error || t("notFound")}
          </p>
          <button
            onClick={() => router.push("/joined")}
            className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {tJoined("backToJoined")}
          </button>
        </div>
      </div>
    );
  }

  // Get current user's voted slot IDs
  const currentUserVotes: string[] = user
    ? eventDetailData.votes
        .filter((vote) => vote.userId === user.id.toString())
        .map((vote) => vote.slotId)
    : [];

  // Check if current user has voted
  const hasVoted = user
    ? eventDetailData.expectedParticipants.some(
        (p) =>
          (p.userId === user.id.toString() ||
            p.user?.id === user.id.toString()) &&
          p.hasVoted
      )
    : false;

  return (
    <div className="space-y-6">
      {/* Compact Event Info */}
      <EventInfoCompact
        title={eventDetailData.event.title}
        description={eventDetailData.event.description}
        startDate={eventDetailData.event.startDate}
        endDate={eventDetailData.event.endDate}
        startMinuteOfDay={eventDetailData.event.startMinuteOfDay}
        endMinuteOfDay={eventDetailData.event.endMinuteOfDay}
        status={eventDetailData.event.status}
        hasVoted={hasVoted}
        confirmedTimeRanges={eventDetailData.event.confirmedTimeRanges}
        votingDeadline={eventDetailData.event.votingDeadline}
      />

      {/* Voting Grid */}
      <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 p-6">
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
    </div>
  );
}
