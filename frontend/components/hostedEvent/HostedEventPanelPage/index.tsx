"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useHostedEventContext } from "@/contexts/HostedEventContext";
import { VotingProgress } from "@/components/ui/VotingProgress";
import { EventStatus } from "@/types/event";
import ResultsView from "@/components/eventCommon/timeGrid/ResultsView";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { VotingStatusBar } from "./VotingStatusBar";
import { EventTimeSelector } from "./EventTimeSelector";
import { ConfirmTimeDialog } from "./ConfirmTimeDialog";
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
  const { data, refetch } = useHostedEventContext();

  // Participants and votes data
  const { participantsWithAvatars, votesWithAvatars, totalParticipants } =
    useParticipantsData(data);

  // Event time confirmation/reset logic
  const {
    isConfirming,
    confirmError,
    showConfirmDialog,
    setShowConfirmDialog,
    handleConfirmClick,
    handleConfirmEventTime,
    isResetMode,
    isResetting,
    resetError,
    handleResetEventTime,
  } = useEventTimeConfirmation({
    eventId,
    eventStatus: data?.event.status ?? EventStatus.VOTING,
    getAllSelectedSlotIds: () => selection.getAllSelectedSlotIds(),
    clearSelections: () => selection.clearSelections(),
    refetch,
  });

  // Event time selection logic
  const selection = useEventTimeSelection({
    totalParticipants,
    confirmedSlotIds: data?.event.confirmedSlotIds,
    confirmedTimeRanges: data?.event.confirmedTimeRanges,
    isResetMode,
  });

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
  const hasConfirmedTime =
    !isResetMode && event.confirmedSlotIds && event.confirmedSlotIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Voting Phase Content */}
      {isVotingPhase && (
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

      {/* Voting Ended Phase - Just show voting stats */}
      {isVotingEnded && (
        <VotingProgress
          votingPercentage={votingStats.votingPercentage}
          totalVoted={votingStats.totalVoted}
          totalExpected={votingStats.totalExpected}
        />
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
          {/* Event Time Selector - Combined header and time list */}
          <EventTimeSelector
            selectedRanges={selection.allTimeRanges}
            onRemove={selection.removeTimeRange}
            onConfirm={handleConfirmClick}
            onReset={() => void handleResetEventTime()}
            isVotingPhase={isVotingPhase}
            isVotingEnded={isVotingEnded}
            isConfirming={isConfirming}
            isResetting={isResetting}
            hasUserSelection={selection.hasUserSelection}
            hasConfirmedTime={!!hasConfirmedTime}
          />

          {/* Results View with HeatMap */}
          <ResultsView
            slots={slots}
            votes={votesWithAvatars}
            participants={participantsWithAvatars}
            eventId={eventId}
            canAddToEventTime={true}
            isVotingPhase={isVotingPhase}
            onAddToEventTime={selection.addTimeRange}
            selectedSlotIds={selection.selectedSlotIdsSet}
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

      {/* Confirm Time Dialog */}
      <ConfirmTimeDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => void handleConfirmEventTime()}
        isVotingPhase={isVotingPhase}
        slotsCount={selection.getAllSelectedSlotIds().length}
        isConfirming={isConfirming}
      />
    </div>
  );
}
