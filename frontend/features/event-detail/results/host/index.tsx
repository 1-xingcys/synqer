"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { LoadingState } from "@/components/ui/loading-state";
import { EventStatus } from "@/types/event";
import { normalizeGranularity, toVoteMode } from "@/lib/eventPreference";
import ResultsView from "@/features/time-grid/ResultsView";
import { SlotRangeInfo } from "@/features/time-grid/ResultsView";
import { EventTimeSelector } from "./EventTimeSelector";
import { EventResultShareButton } from "./EventResultShareButton";
import {
  useEventTimeSelection,
  useEventTimeConfirmation,
  useParticipantsData,
} from "./hooks";

export default function HostResultsView() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const { data, isLoading } = useHostedEventDetail(eventId);

  // Participants and votes data
  const { participantsWithAvatars, votesWithAvatars } =
    useParticipantsData(data);

  // Event time confirmation/reset logic (with optimistic updates)
  const {
    confirmError,
    addConfirmedTime,
    removeConfirmedTime,
    commitStagedConfirmation,
    discardStagedConfirmation,
    isPatchPending,
    isCommitPending,
    isDiscardPending,
  } = useEventTimeConfirmation({
    eventId,
    confirmedSlotIds: data?.event.confirmedSlotIds,
    stagedConfirmation: data?.stagedConfirmation,
  });

  const {
    displayRanges,
    committedSlotIdsSet,
    stagedSlotIdsSet,
    stagedBaselineSlotIdsSet,
    hasStagedChanges,
  } = useEventTimeSelection({
    slots: data?.slots ?? [],
    confirmedSlotIds: data?.event.confirmedSlotIds,
    stagedConfirmation: data?.stagedConfirmation,
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
      const range = displayRanges.find((r) => r.id === rangeId);
      if (range) {
        await removeConfirmedTime(range.slotIds);
      }
    },
    [displayRanges, removeConfirmedTime],
  );

  const event = data?.event;
  const slots = data?.slots || [];
  const isVotingPhase = event?.status === EventStatus.VOTING;
  const hasCommittedConfirmation = committedSlotIdsSet.size > 0;
  const eventTitle = event?.title || t("event.untitled");

  // Host data comes from a separate /events/:id/hosted query, so this view shows its own loading state.
  if (isLoading) {
    return <LoadingState label={t("common.loading")} viewport="section" />;
  }

  if (!data || !event) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Error messages */}
      {confirmError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {confirmError}
          </p>
        </div>
      )}

      {/* Event Time Selector - shows confirmed/staged times (self-hides when empty) */}
      <EventTimeSelector
        selectedRanges={displayRanges}
        onRemove={handleRemoveConfirmedTime}
        hasConfirmedTime={hasCommittedConfirmation}
        hasStagedChanges={hasStagedChanges}
        onCommit={() => void commitStagedConfirmation()}
        onDiscard={() => void discardStagedConfirmation()}
        isPatchPending={isPatchPending}
        isCommitPending={isCommitPending}
        isDiscardPending={isDiscardPending}
        isVotingPhase={isVotingPhase}
        headerAction={
          <EventResultShareButton
            eventId={eventId}
            eventTitle={eventTitle}
            slots={data.slots || []}
            confirmedSlotIds={event.confirmedSlotIds}
            votes={data.votes || []}
            expectedParticipants={data.expectedParticipants || []}
            hasStagedChanges={hasStagedChanges}
          />
        }
      />

      {/* Results View with HeatMap */}
      <ResultsView
        slots={slots}
        votes={votesWithAvatars}
        participants={participantsWithAvatars}
        eventId={eventId}
        defaultGranularity={normalizeGranularity(event.defaultGranularityMin)}
        defaultMode={toVoteMode(event.defaultVoteMode)}
        tip={t("hosted.eventTimeSelector.emptyHint")}
        canAddToEventTime={true}
        isVotingPhase={isVotingPhase}
        onAddToEventTime={handleAddToEventTime}
        committedSlotIds={committedSlotIdsSet}
        stagedSlotIds={stagedSlotIdsSet}
        stagedBaselineSlotIds={stagedBaselineSlotIdsSet}
      />
    </div>
  );
}
