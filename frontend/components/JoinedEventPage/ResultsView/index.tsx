"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ResultsViewProps, SlotRangeInfo } from "./types";
import { ParticipantFilter } from "./ParticipantFilter";
import { HeatMapLegend } from "./HeatMapLegend";
import { ResultsHeatmapGrid } from "./ResultsHeatmapGrid";

export type { ResultsViewProps, SlotRangeInfo };

export default function ResultsView({
  slots,
  votes,
  participants,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
}: ResultsViewProps) {
  const t = useTranslations("joined");

  // Initialize with all participants selected
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    () => new Set(participants.map((p) => p.userId)),
  );

  // Filter votes based on selected participants
  const filteredVotes = useMemo(() => {
    if (selectedParticipants.size === 0) return [];
    return votes.filter((vote) => selectedParticipants.has(vote.userId));
  }, [votes, selectedParticipants]);

  // Calculate max votes for heatmap scaling
  const maxVotes = useMemo(() => {
    if (filteredVotes.length === 0) return 0;

    // Group votes by slot
    const votesBySlot: Record<string, Set<string>> = {};
    filteredVotes.forEach((vote) => {
      if (!votesBySlot[vote.slotId]) {
        votesBySlot[vote.slotId] = new Set();
      }
      votesBySlot[vote.slotId].add(vote.userId);
    });

    // Find max unique voters per slot
    return Math.max(
      ...Object.values(votesBySlot).map((voters) => voters.size),
      1,
    );
  }, [filteredVotes]);

  // Show empty state if no participants selected
  const showEmptyState = selectedParticipants.size === 0;

  return (
    <div className="space-y-5">
      {/* Filter & Legend Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 space-y-4">
        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-3">
            <ParticipantFilter
              participants={participants}
              selectedParticipants={selectedParticipants}
              onSelectionChange={setSelectedParticipants}
            />
          </div>

          {/* Quick info */}
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            {t("results.showingAvailability", {
              count: selectedParticipants.size,
              total: participants.length,
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
          <HeatMapLegend
            maxVotes={maxVotes}
            selectedParticipantsCount={selectedParticipants.size}
          />
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-3 sm:p-5">
        {showEmptyState ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {t("results.noParticipantsSelected")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
              {t("results.selectParticipantsHint")}
            </p>
          </div>
        ) : (
          <ResultsHeatmapGrid
            slots={slots}
            votes={votes}
            participants={participants}
            selectedParticipants={selectedParticipants}
            maxVotes={maxVotes}
            canAddToEventTime={canAddToEventTime}
            isVotingPhase={isVotingPhase}
            onAddToEventTime={onAddToEventTime}
          />
        )}
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
        {t("results.clickToSeeWho")}
      </p>
    </div>
  );
}
