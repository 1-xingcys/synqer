import { VoteMode, type EventVoteModeDto } from "@/types/event";
import type { TimeGranularity } from "@/components/eventCommon/timeGrid/types";

/**
 * Host-controlled view defaults for an event's time grid.
 *
 * These only seed the initial view: participants can still switch granularity
 * and vote mode themselves, and their choice is never persisted.
 */

export const GRANULARITY_OPTIONS: TimeGranularity[] = [15, 30, 60];
export const DEFAULT_GRANULARITY: TimeGranularity = 30;
export const DEFAULT_VOTE_MODE: VoteMode = VoteMode.AVAILABLE;

export function normalizeGranularity(
  value: number | null | undefined,
): TimeGranularity {
  return GRANULARITY_OPTIONS.includes(value as TimeGranularity)
    ? (value as TimeGranularity)
    : DEFAULT_GRANULARITY;
}

/** The wire format is uppercase; the grid works in lowercase `VoteMode`. */
export function toVoteMode(
  value: EventVoteModeDto | null | undefined,
): VoteMode {
  return value === "UNAVAILABLE" ? VoteMode.UNAVAILABLE : VoteMode.AVAILABLE;
}

export function toVoteModeDto(mode: VoteMode): EventVoteModeDto {
  return mode === VoteMode.UNAVAILABLE ? "UNAVAILABLE" : "AVAILABLE";
}
