"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import VotingGrid from "@/components/JoinedEventPage/VotingGrid";
import { EventStatus } from "@/types/event";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import { AddToCalendarPanel } from "@/components/JoinedEventPage/AddToCalendarPanel";

export default function JoinedEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const tJoined = useTranslations("joined");
  const { user } = useAuthContext();
  const { data: eventDetailData, saveVotes } = useJoinedEventContext();

  // Loading and error states are handled by the layout
  if (!eventDetailData) {
    return null;
  }

  // Check if voting is allowed (only during VOTING status)
  const canVote = eventDetailData.event.status === EventStatus.VOTING;

  // Get current user's voted slot IDs
  const currentUserVotes: string[] = user
    ? eventDetailData.votes
        .filter((vote) => vote.userId === user.id.toString())
        .map((vote) => vote.slotId)
    : [];

  const { event } = eventDetailData;

  return (
    <div className="space-y-6">
      {/* Voting Grid - only shown during VOTING status */}
      {canVote && (
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 p-2 sm:p-6">
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
      )}

      {/* Non-voting states */}
      {!canVote && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Status-specific content */}
          {event.status === EventStatus.VOTING_ENDED && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-600 dark:text-amber-400"
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
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {tJoined("votingEnded.title")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                {tJoined("votingEnded.description")}
              </p>
              <Link
                href={`/joined/${eventId}/results`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {tJoined("viewResults")}
              </Link>
            </div>
          )}

          {event.status === EventStatus.CONFIRMED && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
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
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {tJoined("confirmed.title")}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {tJoined("confirmed.description")}
                </p>
              </div>

              {/* Confirmed Time Display */}
              {event.confirmedTimeRanges &&
                event.confirmedTimeRanges.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {tJoined("confirmed.eventTime")}
                    </h4>
                    <ConfirmedTimeDisplay
                      timeRanges={event.confirmedTimeRanges}
                      className="text-green-700 dark:text-green-400"
                    />
                  </div>
                )}

              {/* Add to Google Calendar */}
              {event.confirmedTimeRanges &&
                event.confirmedTimeRanges.length > 0 && (
                  <AddToCalendarPanel
                    eventTitle={event.title || tJoined("untitledEvent")}
                    eventDescription={event.description}
                    confirmedTimeRanges={event.confirmedTimeRanges}
                  />
                )}
            </div>
          )}

          {event.status === EventStatus.COMPLETED && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-zinc-500 dark:text-zinc-400"
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
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {tJoined("completed.title")}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {tJoined("completed.description")}
                </p>
              </div>

              {/* Confirmed Time Display */}
              {event.confirmedTimeRanges &&
                event.confirmedTimeRanges.length > 0 && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {tJoined("confirmed.eventTime")}
                    </h4>
                    <ConfirmedTimeDisplay
                      timeRanges={event.confirmedTimeRanges}
                      className="text-zinc-600 dark:text-zinc-400"
                    />
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
