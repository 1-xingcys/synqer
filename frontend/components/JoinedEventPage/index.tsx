"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventDetail } from "@/hooks/useEventDetail";
import VotingGrid from "@/components/JoinedEventPage/VotingGrid";
import EventInfo from "@/components/JoinedEventPage/EventInfo";

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
      <div className="flex min-h-[60vh] items-center justify-center">
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
      <div className="flex min-h-[60vh] items-center justify-center">
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

  // Calculate voting stats
  const totalParticipants = eventDetailData.participants.length;
  const votedParticipants = new Set(eventDetailData.votes.map((v) => v.userId))
    .size;

  return (
    <div className="py-8 space-y-6">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/joined")}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>{tJoined("backToJoined")}</span>
        </button>
      </div>

      {/* Event Info */}
      <EventInfo
        event={eventDetailData.event}
        participants={eventDetailData.participants}
      />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/joined/${eventId}/participants`}
          className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
        >
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tJoined("participants")}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {votedParticipants}/{totalParticipants}{" "}
              {tJoined("voted").toLowerCase()}
            </div>
          </div>
          <svg
            className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>

        <Link
          href={`/joined/${eventId}/results`}
          className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
        >
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tJoined("results")}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {tJoined("viewResultsDescription")}
            </div>
          </div>
          <svg
            className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

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
