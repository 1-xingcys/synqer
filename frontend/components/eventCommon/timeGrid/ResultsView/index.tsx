"use client";

import { useEffect, useMemo, useCallback } from "react";
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
import { useFilteredVotes } from "./hooks/useFilteredVotes";
import { TimeGranularity } from "../types";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Z_INDEX } from "@/lib/zIndex";

export type { ResultsViewProps, SlotRangeInfo };

const SELECTED_PARAM = "selected";
const SELECTED_ALL = "all";
const MODE_PARAM = "mode";
const GRANULARITY_PARAM = "granularity";
const DEFAULT_MODE: ResultsAvailabilityMode = "available";
const DEFAULT_GRANULARITY: TimeGranularity = 15;

function normalizeMode(value: string | null): ResultsAvailabilityMode {
  return value === "unavailable" ? "unavailable" : "available";
}

function normalizeGranularity(value: string | null): TimeGranularity {
  if (value === "30") return 30;
  if (value === "60") return 60;
  return 15;
}

export default function ResultsView({
  slots,
  votes,
  participants,
  eventId,
  canAddToEventTime = false,
  isVotingPhase = false,
  onAddToEventTime,
  committedSlotIds,
  stagedSlotIds,
  stagedBaselineSlotIds,
}: ResultsViewProps) {
  const t = useTranslations("joined");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedParticipants = useMemo((): Set<string> => {
    const selectedParam = searchParams.get(SELECTED_PARAM);
    const allIds = participants.map((p) => p.userId);
    const validIds = new Set(allIds);

    if (selectedParam === null || selectedParam === SELECTED_ALL) {
      return new Set(allIds);
    }
    if (selectedParam === "") {
      return new Set();
    }

    const selectedIds = selectedParam.split(",").filter(Boolean);
    return new Set(selectedIds.filter((id) => validIds.has(id)));
  }, [searchParams, participants]);

  const availabilityMode = useMemo(
    () => normalizeMode(searchParams.get(MODE_PARAM)),
    [searchParams],
  );

  const granularity = useMemo(
    () => normalizeGranularity(searchParams.get(GRANULARITY_PARAM)),
    [searchParams],
  );

  const serializeSelectionParam = useCallback(
    (selection: Set<string>): string => {
      const allSelected = selection.size === participants.length;
      if (allSelected) return SELECTED_ALL;
      if (selection.size === 0) return "";
      return Array.from(selection).sort().join(",");
    },
    [participants.length],
  );

  // Add default URL params if not present
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (searchParams.get(SELECTED_PARAM) === null && participants.length > 0) {
      params.set(SELECTED_PARAM, SELECTED_ALL);
      changed = true;
    }
    if (searchParams.get(MODE_PARAM) === null) {
      params.set(MODE_PARAM, DEFAULT_MODE);
      changed = true;
    }
    if (searchParams.get(GRANULARITY_PARAM) === null) {
      params.set(GRANULARITY_PARAM, String(DEFAULT_GRANULARITY));
      changed = true;
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router, participants.length]);

  // Update URL when selection changes
  const handleSelectionChange = useCallback(
    (newSelection: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(SELECTED_PARAM, serializeSelectionParam(newSelection));

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, serializeSelectionParam, pathname, router],
  );

  const handleModeChange = useCallback(
    (nextMode: ResultsAvailabilityMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(MODE_PARAM, nextMode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const handleGranularityChange = useCallback(
    (nextGranularity: TimeGranularity) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(GRANULARITY_PARAM, String(nextGranularity));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  // Share link with filter state (for results page)
  const { copied: linkCopied, copy } = useCopyToClipboard();

  // Build shareable link: joined/[eventId]/results?selected=...
  const getShareableLink = useCallback((): string => {
    const url = new URL(`${window.location.origin}/joined/${eventId}/results`);
    url.searchParams.set(
      SELECTED_PARAM,
      serializeSelectionParam(selectedParticipants),
    );
    url.searchParams.set(MODE_PARAM, availabilityMode);
    url.searchParams.set(GRANULARITY_PARAM, String(granularity));
    return url.toString();
  }, [
    eventId,
    serializeSelectionParam,
    selectedParticipants,
    availabilityMode,
    granularity,
  ]);

  const copyShareableLink = useCallback(() => {
    return copy(getShareableLink());
  }, [copy, getShareableLink]);

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
      <div
        className={`relative flex flex-col ${Z_INDEX.GRID_BASE} bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-3 sm:p-5 mt-3 sm:mt-4`}
      >
        {/* Filter & Legend Section */}
        <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
          <HeatMapLegend maxVotes={legendMaxVotes} mode={availabilityMode} />
          <ParticipantFilter
            participants={participants}
            selectedParticipants={selectedParticipants}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        <div className="mt-3 border-t border-zinc-200 dark:border-zinc-700" />

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
            committedSlotIds={committedSlotIds}
            stagedSlotIds={stagedSlotIds}
            stagedBaselineSlotIds={stagedBaselineSlotIds}
            mode={availabilityMode}
            onModeChange={handleModeChange}
            granularity={granularity}
            onGranularityChange={handleGranularityChange}
            getShareableLink={getShareableLink}
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
