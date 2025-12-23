"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { EventInfoCompact } from "@/components/eventCommon/EventInfoCompact";
import { VotingProgress } from "@/components/ui/VotingProgress";
import { EventStatus } from "@/types/event";
import ResultsView, {
  SlotRangeInfo,
} from "@/components/eventCommon/ResultsView";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { SelectedEventTimes, SelectedTimeRange } from "./SelectedEventTimes";
import { ConfirmTimeDialog } from "./ConfirmTimeDialog";
import { ConfirmedTimeDisplay } from "@/components/eventCommon/ConfirmedTimeDisplay";

export default function HostedEventPanelPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const router = useRouter();
  const { data, loading, error, refetch } = useHostedEventDetail(eventId);

  // State for selected event times
  const [selectedTimeRanges, setSelectedTimeRanges] = useState<
    SelectedTimeRange[]
  >([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Transform participants to include avatar info for ResultsView
  const participantsWithAvatars = useMemo(() => {
    if (!data) return [];

    return data.expectedParticipants.map((p) => ({
      userId: p.userId || p.id,
      displayName: p.displayName || "Unknown",
      pictureUrl: p.pictureUrl,
    }));
  }, [data]);

  // Create a mapping of userId to pictureUrl for votes
  const pictureUrlMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    participantsWithAvatars.forEach((p) => {
      if (p.userId) {
        map.set(p.userId, p.pictureUrl);
      }
    });
    return map;
  }, [participantsWithAvatars]);

  // Transform votes to include avatar info
  const votesWithAvatars = useMemo(() => {
    if (!data) return [];

    return data.votes.map((vote) => ({
      ...vote,
      pictureUrl: pictureUrlMap.get(vote.userId),
    }));
  }, [data, pictureUrlMap]);

  // Handle adding a time range to selected event times
  const handleAddToEventTime = useCallback(
    (info: SlotRangeInfo, availableCount: number) => {
      // Generate a unique ID for this range
      const rangeId = `${info.startDate}-${info.startTime}-${info.endDate}-${info.endTime}`;

      // Check if this range already exists (to prevent duplicates)
      const exists = selectedTimeRanges.some((r) => r.id === rangeId);
      if (exists) return;

      const newRange: SelectedTimeRange = {
        id: rangeId,
        startDate: info.startDate,
        endDate: info.endDate,
        startTime: info.startTime,
        endTime: info.endTime,
        slotIds: info.slotIds,
        availableCount,
        totalParticipants: participantsWithAvatars.length,
      };

      setSelectedTimeRanges((prev) => [...prev, newRange]);
      setConfirmError(null);
    },
    [selectedTimeRanges, participantsWithAvatars.length],
  );

  // Handle removing a time range
  const handleRemoveTimeRange = useCallback((id: string) => {
    setSelectedTimeRanges((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Get all slot IDs from selected ranges
  const getAllSelectedSlotIds = useCallback(() => {
    const slotIdSet = new Set<string>();
    selectedTimeRanges.forEach((range) => {
      range.slotIds.forEach((id) => slotIdSet.add(id));
    });
    return Array.from(slotIdSet);
  }, [selectedTimeRanges]);

  // Handle actual confirmation to backend
  const handleConfirmEventTime = useCallback(async () => {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const slotIds = getAllSelectedSlotIds();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/confirm-time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ slotIds }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to confirm time");
      }

      // Success - refetch data and clear selection
      await refetch();
      setSelectedTimeRanges([]);
      setShowConfirmDialog(false);

      // Optionally redirect to the event page
      router.push(`/hosted/${eventId}`);
    } catch {
      setConfirmError(t("hosted.confirmError"));
    } finally {
      setIsConfirming(false);
    }
  }, [eventId, getAllSelectedSlotIds, refetch, router, t]);

  // Handle confirm button click
  const handleConfirmClick = useCallback(() => {
    if (!data) return;

    const isVotingPhase = data.event.status === EventStatus.VOTING;

    if (isVotingPhase) {
      // Show confirmation dialog for voting phase
      setShowConfirmDialog(true);
    } else {
      // Direct confirm for voting-ended phase
      void handleConfirmEventTime();
    }
  }, [data, handleConfirmEventTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
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
          <p className="text-red-600 dark:text-red-400">
            {error || t("event.notFound")}
          </p>
        </div>
      </div>
    );
  }

  const { event, slots, votingStats } = data;
  const isVotingPhase = event.status === EventStatus.VOTING;
  const isVotingEnded = event.status === EventStatus.VOTING_ENDED;
  const isConfirmed = event.status === EventStatus.CONFIRMED;
  const isCompleted = event.status === EventStatus.COMPLETED;
  const showResultsView = isVotingPhase || isVotingEnded || isConfirmed;

  return (
    <div className="space-y-6">
      {/* Event Info Compact */}
      <EventInfoCompact
        title={event.title}
        description={event.description}
        startDate={event.startDate}
        endDate={event.endDate}
        startMinuteOfDay={event.startMinuteOfDay}
        endMinuteOfDay={event.endMinuteOfDay}
        status={event.status}
        confirmedTimeRanges={event.confirmedTimeRanges}
        votingDeadline={event.votingDeadline}
      />

      {/* Voting Phase Content */}
      {isVotingPhase && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deadline Countdown */}
          <DeadlineCountdown votingDeadline={event.votingDeadline} />

          {/* Voting Progress */}
          <VotingProgress
            title={t("hosted.votingProgress")}
            votingPercentage={votingStats.votingPercentage}
            totalVoted={votingStats.totalVoted}
            totalExpected={votingStats.totalExpected}
          />
        </div>
      )}

      {/* Voting Ended Phase - Just show voting stats */}
      {isVotingEnded && (
        <VotingProgress
          title={t("hosted.votingProgress")}
          votingPercentage={votingStats.votingPercentage}
          totalVoted={votingStats.totalVoted}
          totalExpected={votingStats.totalExpected}
        />
      )}

      {/* Selected Event Times (shown above results when there are selections) */}
      {showResultsView && selectedTimeRanges.length > 0 && (
        <SelectedEventTimes
          selectedRanges={selectedTimeRanges}
          onRemove={handleRemoveTimeRange}
          onConfirm={handleConfirmClick}
          isVotingPhase={isVotingPhase}
          isConfirming={isConfirming}
        />
      )}

      {/* Error message */}
      {confirmError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {confirmError}
          </p>
        </div>
      )}

      {/* Results Section */}
      {showResultsView && (
        <>
          {/* Results Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hosted.currentResults")}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("hosted.selectTimeHint")}
            </p>
          </div>

          {/* Results View with HeatMap */}
          <ResultsView
            slots={slots}
            votes={votesWithAvatars}
            participants={participantsWithAvatars}
            canAddToEventTime={true}
            isVotingPhase={isVotingPhase}
            onAddToEventTime={handleAddToEventTime}
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
        slotsCount={getAllSelectedSlotIds().length}
        isConfirming={isConfirming}
      />
    </div>
  );
}
