"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ResultsAvailabilityMode,
  ResultsViewProps,
  SlotRangeInfo,
} from "./types";
import { ParticipantFilter } from "./ParticipantFilter";
import { HeatMapLegend } from "./HeatMapLegend";
import { ResultsHeatmapGrid } from "./ResultsHeatmapGrid";
import { useFilteredVotes } from "../hooks";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useLiff } from "@/hooks/useLiff";

export type { ResultsViewProps, SlotRangeInfo };

const SELECTED_PARAM = "selected";
const SELECTED_ALL = "all";

export default function ResultsView({
  slots,
  votes,
  participants,
  eventId,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  selectedSlotIds,
}: ResultsViewProps) {
  const t = useTranslations("joined");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [availabilityMode, setAvailabilityMode] =
    useState<ResultsAvailabilityMode>("available");

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

  // Share link with filter state (for results page)
  const { isInClient } = useLiff();
  const { copied: linkCopied, copy } = useCopyToClipboard();

  // Build shareable link: joined/[eventId]/results?selected=...
  const copyShareableLink = useCallback(() => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    const resultsPath = `/joined/${eventId}/results`;

    // Build base URL based on environment
    let baseUrl: string;
    if (isInClient && liffId) {
      baseUrl = `https://liff.line.me/${liffId}${resultsPath}`;
    } else {
      baseUrl = `${window.location.origin}${resultsPath}`;
    }

    const url = new URL(baseUrl);
    // Preserve current filter params
    const selectedParam = searchParams.get(SELECTED_PARAM);
    if (selectedParam !== null) {
      url.searchParams.set(SELECTED_PARAM, selectedParam);
    }
    return copy(url.toString());
  }, [eventId, isInClient, searchParams, copy]);

  // Use hook for filtered votes calculation
  const { votesBySlot, maxVotes } = useFilteredVotes({
    votes,
    selectedParticipants,
  });
  const legendMaxVotes =
    availabilityMode === "available" ? maxVotes : selectedParticipants.size;

  // Show empty state if no participants selected
  const showEmptyState = selectedParticipants.size === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tip */}
      {!canAddToEventTime && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
          {t("results.clickToSeeWho")}
        </p>
      )}
      <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-3 sm:p-5 mt-3 sm:mt-4">
        {/* Filter & Legend Section */}
        <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
          <HeatMapLegend maxVotes={legendMaxVotes} mode={availabilityMode} />
          <ParticipantFilter
            participants={participants}
            selectedParticipants={selectedParticipants}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        <div className="my-3 sm:my-6 border-t border-zinc-200 dark:border-zinc-700" />

        {/* Heatmap Grid */}
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
            mode={availabilityMode}
            onModeChange={setAvailabilityMode}
            onCopyShareLink={() => {
              void copyShareableLink();
            }}
            linkCopied={linkCopied}
          />
        )}
      </div>
    </div>
  );
}
