"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useMemo } from "react";
import Image from "next/image";

export default function JoinedEventParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const router = useRouter();

  const { data: eventDetailData, loading, error } = useEventDetail(eventId);

  // Calculate who has voted based on expectedParticipants
  const { votedParticipants, pendingParticipants } = useMemo(() => {
    if (!eventDetailData)
      return { votedParticipants: [], pendingParticipants: [] };

    // 使用 expectedParticipants 來判斷投票狀態
    const voted = eventDetailData.expectedParticipants
      .filter((p) => p.hasVoted)
      .map((p) => ({
        id: p.id,
        displayName:
          p.user?.displayName || p.lineGroupMember?.displayName || "Unknown",
        pictureUrl: p.user?.avatarUrl || p.lineGroupMember?.pictureUrl,
      }));

    const pending = eventDetailData.expectedParticipants
      .filter((p) => !p.hasVoted)
      .map((p) => ({
        id: p.id,
        displayName:
          p.user?.displayName || p.lineGroupMember?.displayName || "Unknown",
        pictureUrl: p.user?.avatarUrl || p.lineGroupMember?.pictureUrl,
      }));

    return { votedParticipants: voted, pendingParticipants: pending };
  }, [eventDetailData]);

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

  const totalParticipants = eventDetailData.expectedParticipants.length;
  const votedCount = votedParticipants.length;
  const progress =
    totalParticipants > 0 ? (votedCount / totalParticipants) * 100 : 0;

  return (
    <div className="py-8 space-y-6">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href={`/joined/${eventId}`}
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
          <span>{tJoined("backToEvent")}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {tJoined("participants")}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {eventDetailData.event.title || t("untitled")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {votedCount}
              <span className="text-zinc-400 dark:text-zinc-500">
                /{totalParticipants}
              </span>
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {tJoined("voted")}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{tJoined("votingProgress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Voted participants */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-emerald-50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="font-semibold text-emerald-800 dark:text-emerald-300">
              {tJoined("votedParticipants")} ({votedParticipants.length})
            </h2>
          </div>
        </div>
        {votedParticipants.length === 0 ? (
          <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
            {tJoined("noVotesYet")}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {votedParticipants.map((participant) => (
              <li
                key={participant.id}
                className="px-6 py-4 flex items-center gap-3"
              >
                {participant.pictureUrl ? (
                  <Image
                    src={participant.pictureUrl}
                    alt={participant.displayName || ""}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    {participant.displayName[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {participant.displayName}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {tJoined("voted")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending participants */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="font-semibold text-amber-800 dark:text-amber-300">
              {tJoined("pendingParticipants")} ({pendingParticipants.length})
            </h2>
          </div>
        </div>
        {pendingParticipants.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {tJoined("allVoted")}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {pendingParticipants.map((participant) => (
              <li
                key={participant.id}
                className="px-6 py-4 flex items-center gap-3"
              >
                {participant.pictureUrl ? (
                  <Image
                    src={participant.pictureUrl}
                    alt={participant.displayName || ""}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 font-semibold">
                    {participant.displayName[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {participant.displayName}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {tJoined("notVoted")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
