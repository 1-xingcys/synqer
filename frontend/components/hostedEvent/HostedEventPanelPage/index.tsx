"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import { VotingProgress } from "@/components/ui/VotingProgress";
import { EventStatus } from "@/types/event";
import ResultsView from "@/components/eventCommon/timeGrid/ResultsView";
import { SlotRangeInfo } from "@/components/eventCommon/timeGrid/ResultsView";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { VotingStatusBar } from "./VotingStatusBar";
import { EventTimeSelector } from "./EventTimeSelector";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";
import {
  useEventTimeSelection,
  useEventTimeConfirmation,
  useParticipantsData,
} from "./hooks";

export default function HostedEventPanelPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const { data } = useHostedEventContext();

  // Participants and votes data
  const { participantsWithAvatars, votesWithAvatars, totalParticipants } =
    useParticipantsData(data);

  // Event time confirmation/reset logic (with optimistic updates)
  const {
    confirmError,
    addConfirmedTime,
    removeConfirmedTime,
    isResetMode,
    resetError,
    handleResetEventTime,
  } = useEventTimeConfirmation({
    eventId,
    eventStatus: data?.event.status ?? EventStatus.VOTING,
    confirmedSlotIds: data?.event.confirmedSlotIds,
  });

  // Event time selection logic (now only for display)
  const { confirmedTimeRangesDisplay, selectedSlotIdsSet } =
    useEventTimeSelection({
      totalParticipants,
      confirmedSlotIds: data?.event.confirmedSlotIds,
      confirmedTimeRanges: data?.event.confirmedTimeRanges,
      isResetMode,
    });

  // Handle adding time range (called from SlotDetailModal)
  const handleAddToEventTime = useCallback(
    async (info: SlotRangeInfo): Promise<boolean> => {
      return await addConfirmedTime(info.slotIds);
    },
    [addConfirmedTime],
  );

  // Handle removing a confirmed time range
  const handleRemoveConfirmedTime = useCallback(
    async (rangeId: string) => {
      // Find the range by ID to get its slotIds
      const range = confirmedTimeRangesDisplay.find((r) => r.id === rangeId);
      if (range) {
        await removeConfirmedTime(range.slotIds);
      }
    },
    [confirmedTimeRangesDisplay, removeConfirmedTime],
  );

  // Loading and error states are handled by the layout
  if (!data) {
    return null;
  }

  const { event, slots, votingStats } = data;
  const isVotingPhase = event.status === EventStatus.VOTING;
  const isVotingEnded = event.status === EventStatus.VOTING_ENDED;
  const isConfirmed = event.status === EventStatus.CONFIRMED;
  const isCompleted = event.status === EventStatus.COMPLETED;
  const showResultsView = isVotingPhase || isVotingEnded || isConfirmed;
  // hasConfirmedTime should be false when in reset mode
  const hasConfirmedTime = selectedSlotIdsSet.size > 0;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Voting Phase & Voting Ended - Show deadline countdown and voting progress */}
      {(isVotingPhase || isVotingEnded) && (
        <>
          {/* Mobile: Compact Status Bar */}
          <div className="sm:hidden">
            <VotingStatusBar
              votingDeadline={event.votingDeadline}
              votingPercentage={votingStats.votingPercentage}
              totalVoted={votingStats.totalVoted}
              totalExpected={votingStats.totalExpected}
            />
          </div>

          {/* Desktop: Two separate cards */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
            <DeadlineCountdown votingDeadline={event.votingDeadline} />
            <VotingProgress
              votingPercentage={votingStats.votingPercentage}
              totalVoted={votingStats.totalVoted}
              totalExpected={votingStats.totalExpected}
            />
          </div>
        </>
      )}

      {/* Error messages */}
      {(confirmError || resetError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {confirmError || resetError}
          </p>
        </div>
      )}

      {/* Event Time Selector & Results Section */}
      {showResultsView && (
        <>
          {/* Event Time Selector - Show confirmed times */}
          {/* Hide when voting is in progress and no confirmed time */}
          {!(isVotingPhase && !hasConfirmedTime) && (
            <EventTimeSelector
              selectedRanges={confirmedTimeRangesDisplay}
              onRemove={(id) => void handleRemoveConfirmedTime(id)}
              onReset={() => void handleResetEventTime()}
              hasConfirmedTime={hasConfirmedTime}
            />
          )}

          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-2">
            {t("hosted.eventTimeSelector.emptyHint")}
          </p>

          {/* Results View with HeatMap */}
          <ResultsView
            slots={slots}
            votes={votesWithAvatars}
            participants={participantsWithAvatars}
            eventId={eventId}
            canAddToEventTime={true}
            isVotingPhase={isVotingPhase}
            onAddToEventTime={handleAddToEventTime}
            selectedSlotIds={selectedSlotIdsSet}
          />
        </>
      )}

      {/* Completed phase - show confirmed time display */}
      {isCompleted && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
                {t("hosted.statusInfo.completed")}
              </h3>
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
                    {t("joined.confirmed.eventTime")}
                  </h4>
                  <ConfirmedTimeDisplay
                    timeRanges={event.confirmedTimeRanges}
                    className="text-zinc-600 dark:text-zinc-400"
                  />
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
