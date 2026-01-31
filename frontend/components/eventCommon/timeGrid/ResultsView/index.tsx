"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ResultsViewProps, SlotRangeInfo } from "./types";
import { ParticipantFilter } from "./ParticipantFilter";
import { HeatMapLegend } from "./HeatMapLegend";
import { ResultsHeatmapGrid } from "./ResultsHeatmapGrid";
import { useFilteredVotes } from "../hooks";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export type { ResultsViewProps, SlotRangeInfo };

const SELECTED_PARAM = "selected";
const SELECTED_ALL = "all";

export default function ResultsView({
  slots,
  votes,
  participants,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  selectedSlotIds,
}: ResultsViewProps) {
  const t = useTranslations("joined");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { copied: linkCopied, copy } = useCopyToClipboard();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Parse URL param to get initial selection
  const getInitialSelection = useCallback((): Set<string> => {
    const selectedParam = searchParams.get(SELECTED_PARAM);
    if (selectedParam !== null) {
      // URL has selection param
      if (selectedParam === SELECTED_ALL) {
        return new Set(participants.map((p) => p.userId)); // All selected
      }
      if (selectedParam === "") {
        return new Set(); // Empty selection
      }
      const selectedIds = selectedParam.split(",").filter(Boolean);
      // Only include IDs that exist in participants
      const validIds = new Set(participants.map((p) => p.userId));
      return new Set(selectedIds.filter((id) => validIds.has(id)));
    }
    // No param = select all (default), but we'll add ?selected=all to URL
    return new Set(participants.map((p) => p.userId));
  }, [searchParams, participants]);

  // Initialize with URL param or all selected
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    () => new Set(participants.map((p) => p.userId)),
  );

  // Sync state from URL on mount and when searchParams change
  useEffect(() => {
    setSelectedParticipants(getInitialSelection());
  }, [getInitialSelection]);

  // Add ?selected=all to URL if not present (on initial load)
  useEffect(() => {
    if (hasInitialized) return;
    const selectedParam = searchParams.get(SELECTED_PARAM);
    if (selectedParam === null && participants.length > 0) {
      // No param present, add ?selected=all
      const params = new URLSearchParams(searchParams.toString());
      params.set(SELECTED_PARAM, SELECTED_ALL);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    setHasInitialized(true);
  }, [searchParams, pathname, router, participants.length, hasInitialized]);

  // Update URL when selection changes
  const handleSelectionChange = useCallback(
    (newSelection: Set<string>) => {
      setSelectedParticipants(newSelection);

      const params = new URLSearchParams(searchParams.toString());
      const allSelected = newSelection.size === participants.length;

      if (allSelected) {
        // All selected = use "all" keyword
        params.set(SELECTED_PARAM, SELECTED_ALL);
      } else if (newSelection.size === 0) {
        // None selected = empty string
        params.set(SELECTED_PARAM, "");
      } else {
        // Partial selection = store individual IDs
        params.set(SELECTED_PARAM, Array.from(newSelection).join(","));
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, participants.length, pathname, router],
  );

  // Copy shareable link
  const copyShareableLink = useCallback(() => {
    return copy(window.location.href);
  }, [copy]);

  // Use hook for filtered votes calculation
  const { votesBySlot, maxVotes } = useFilteredVotes({
    votes,
    selectedParticipants,
  });

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
              onSelectionChange={handleSelectionChange}
            />

            {/* Copy Link Button */}
            <button
              onClick={() => void copyShareableLink()}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
                border transition-all
                ${
                  linkCopied
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
                }
              `}
              title={t("results.copyLinkTitle")}
            >
              {linkCopied ? (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {t("results.linkCopied")}
                  </span>
                </>
              ) : (
                <>
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
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {t("results.copyLink")}
                  </span>
                </>
              )}
            </button>
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
            votesBySlot={votesBySlot}
            participants={participants}
            selectedParticipants={selectedParticipants}
            maxVotes={maxVotes}
            canAddToEventTime={canAddToEventTime}
            isVotingPhase={isVotingPhase}
            onAddToEventTime={onAddToEventTime}
            selectedSlotIds={selectedSlotIds}
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
