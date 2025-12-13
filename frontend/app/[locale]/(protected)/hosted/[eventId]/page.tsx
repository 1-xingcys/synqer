"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";

export default function HostedEventOverviewPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const { data, loading, error } = useHostedEventDetail(eventId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">
          {error || t("event.notFound")}
        </p>
      </div>
    );
  }

  const { event, participants, votingStats, expectedParticipants } = data;

  const votedParticipants = participants.filter((p) => p.hasVoted);
  const pendingParticipants = expectedParticipants.filter((p) => !p.hasVoted);

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.title || t("event.untitled")}
            </h1>
            {event.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {format(new Date(event.startDate), "MMM d")} -{" "}
                {format(new Date(event.endDate), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <Link
            href={`/events/${eventId}`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {t("dashboard.viewEvent")}
          </Link>
        </div>
      </div>

      {/* Voting Progress */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {t("hosted.votingProgress")}
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-zinc-200 dark:text-zinc-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - votingStats.votingPercentage / 100)}`}
                className="text-blue-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {Math.round(votingStats.votingPercentage)}%
              </span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {votingStats.totalVoted}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("hosted.totalVoted")}
              </p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {votingStats.totalExpected}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("hosted.totalExpected")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Participants Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voted Participants */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hosted.votedParticipants")}
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ({votedParticipants.length})
            </span>
          </div>
          {votedParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
              {t("hosted.noVotesYet")}
            </p>
          ) : (
            <ul className="space-y-2">
              {votedParticipants.map((participant) => (
                <li
                  key={participant.userId}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                    {participant.displayName[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {participant.displayName}
                  </span>
                  <svg
                    className="w-4 h-4 text-green-500 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending Participants */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hosted.pendingParticipants")}
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ({pendingParticipants.length})
            </span>
          </div>
          {pendingParticipants.length === 0 ? (
            <div className="py-4 text-center">
              <svg
                className="w-8 h-8 mx-auto text-green-500 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {t("hosted.allVoted")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pendingParticipants.map((participant) => (
                <li
                  key={participant.id}
                  className="flex items-center gap-3 py-2"
                >
                  {participant.pictureUrl ? (
                    <img
                      src={participant.pictureUrl}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium">
                      {participant.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {participant.displayName || "Unknown"}
                  </span>
                  <svg
                    className="w-4 h-4 text-amber-500 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href={`/hosted/${eventId}/participants`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          {t("hosted.participantsPage.title")}
        </Link>
        <Link
          href={`/hosted/${eventId}/settings`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {t("hosted.settingsPage.title")}
        </Link>
      </div>
    </div>
  );
}

