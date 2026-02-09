"use client";

import { useMemo } from "react";
import { Vote } from "../types";

interface UseFilteredVotesProps {
  votes: Vote[];
  selectedParticipants: Set<string>;
}

interface UseFilteredVotesResult {
  /** 根據選中參與者過濾後的投票 */
  filteredVotes: Vote[];
  /** 根據 slotId 分組的投票 */
  votesBySlot: Record<string, Vote[]>;
  /** 熱力圖縮放用的最大投票數 */
  maxVotes: number;
}

/**
 * 對投票資料做顯示層預處理：
 * 依參與者過濾、按 slot 分組，並計算熱力圖所需的最大票數。
 */
export function useFilteredVotes({
  votes,
  selectedParticipants,
}: UseFilteredVotesProps): UseFilteredVotesResult {
  // Filter votes based on selected participants
  const filteredVotes = useMemo(() => {
    if (selectedParticipants.size === 0) return [];
    return votes.filter((vote) => selectedParticipants.has(vote.userId));
  }, [votes, selectedParticipants]);

  // Group filtered votes by slot
  const votesBySlot = useMemo(() => {
    return filteredVotes.reduce(
      (acc, vote) => {
        if (!acc[vote.slotId]) acc[vote.slotId] = [];
        acc[vote.slotId].push(vote);
        return acc;
      },
      {} as Record<string, Vote[]>,
    );
  }, [filteredVotes]);

  // Calculate max votes for heatmap scaling
  const maxVotes = useMemo(() => {
    if (filteredVotes.length === 0) return 0;

    // Group votes by slot and count unique voters
    const voteCountBySlot: Record<string, Set<string>> = {};
    filteredVotes.forEach((vote) => {
      if (!voteCountBySlot[vote.slotId]) {
        voteCountBySlot[vote.slotId] = new Set();
      }
      voteCountBySlot[vote.slotId].add(vote.userId);
    });

    // Find max unique voters per slot
    return Math.max(
      ...Object.values(voteCountBySlot).map((voters) => voters.size),
      1,
    );
  }, [filteredVotes]);

  return {
    filteredVotes,
    votesBySlot,
    maxVotes,
  };
}
