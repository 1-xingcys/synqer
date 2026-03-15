"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patchStagedVotesApi,
  commitStagedVotesApi,
  eventDetailKeys,
  EventDetailData,
} from "@/hooks/useEventDetail";
import {
  ShareResult,
  shareVoteCommitFlexMessage,
} from "@/lib/line-flex-message";
import { getLiff } from "@/lib/liff";
import { Vote, StagedVote } from "../../types";
import { VoteMode } from "@/types/event";

interface UseOptimisticVotingProps {
  eventId: string;
  currentUserId: string;
  eventTitle: string;
  votes: Vote[];
  stagedVote: StagedVote | null;
}

export type CommitFeedback = "idle" | "success" | "error";
export type CommitShareFeedback = "idle" | "success" | "error";

interface UseOptimisticVotingReturn {
  committedSlots: Set<string>;
  stagedSlots: Set<string>;
  hasStagedVoteDraft: boolean;
  commitFeedback: CommitFeedback;
  updateStagedVotes: (
    addSlotIds: string[],
    removeSlotIds: string[],
    voteMode: VoteMode,
  ) => void;
  commitStagedVotes: () => void;
  isPatchPending: boolean;
  isCommitPending: boolean;
  isPending: boolean;
}

function getCurrentUserCommittedSlots(
  data: EventDetailData,
  currentUserId: string,
): Set<string> {
  return new Set(
    data.votes
      .filter((vote) => vote.userId === currentUserId)
      .map((vote) => vote.slotId),
  );
}

function getCurrentUserHasVoted(
  data: EventDetailData,
  currentUserId: string,
): boolean {
  return data.expectedParticipants.some(
    (participant) =>
      (participant.userId === currentUserId ||
        participant.user?.id === currentUserId) &&
      participant.hasVoted,
  );
}

function orderByAllSlotIds(
  slotIdSet: Set<string>,
  allSlotIds: string[],
): string[] {
  return allSlotIds.filter((slotId) => slotIdSet.has(slotId));
}

function areOrderedSlotIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((slotId, index) => slotId === right[index]);
}

/**
 * staged 投票的樂觀更新：
 * - PATCH /voting/staged 只更新草稿
 * - POST /voting/commit 才覆蓋 committed votes
 */
export function useOptimisticVoting({
  eventId,
  currentUserId,
  eventTitle,
  votes,
  stagedVote,
}: UseOptimisticVotingProps): UseOptimisticVotingReturn {
  const queryClient = useQueryClient();
  const [commitFeedback, setCommitFeedback] = useState<CommitFeedback>("idle");
  const [commitShareFeedback, setCommitShareFeedback] =
    useState<CommitShareFeedback>("idle");

  const committedSlots = useMemo(() => {
    return new Set(
      votes
        .filter((vote) => vote.userId === currentUserId)
        .map((vote) => vote.slotId),
    );
  }, [votes, currentUserId]);

  const stagedSlots = useMemo(
    () => new Set(stagedVote?.slotIds ?? []),
    [stagedVote],
  );
  const hasStagedVoteDraft = stagedVote !== null;

  useEffect(() => {
    if (commitFeedback === "idle" && commitShareFeedback === "idle") return;

    const timerId = window.setTimeout(() => {
      setCommitFeedback("idle");
      setCommitShareFeedback("idle");
    }, 1500);

    return () => window.clearTimeout(timerId);
  }, [commitFeedback, commitShareFeedback]);

  const patchMutation = useMutation({
    mutationFn: ({
      addSlotIds,
      removeSlotIds,
      voteMode,
    }: {
      addSlotIds: string[];
      removeSlotIds: string[];
      voteMode: VoteMode;
    }) => patchStagedVotesApi(eventId, addSlotIds, removeSlotIds, voteMode),
    onMutate: async ({ addSlotIds, removeSlotIds, voteMode }) => {
      await queryClient.cancelQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });

      const previousData = queryClient.getQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
      );

      queryClient.setQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
        (old) => {
          if (!old) return old;

          const allSlotIds = old.slots.map((slot) => slot.id);
          const currentCommittedSlots = getCurrentUserCommittedSlots(
            old,
            currentUserId,
          );
          const currentHasVoted = getCurrentUserHasVoted(old, currentUserId);

          let baseAvailableSlots: Set<string>;
          let baselineAvailableSlots: Set<string>;

          if (old.stagedVote) {
            baseAvailableSlots = new Set(old.stagedVote.slotIds);
            baselineAvailableSlots = new Set(old.stagedVote.baselineSlotIds);
          } else if (currentHasVoted) {
            baseAvailableSlots = new Set(currentCommittedSlots);
            baselineAvailableSlots = new Set(currentCommittedSlots);
          } else if (voteMode === VoteMode.UNAVAILABLE) {
            baseAvailableSlots = new Set(allSlotIds);
            baselineAvailableSlots = new Set(allSlotIds);
          } else {
            baseAvailableSlots = new Set<string>();
            baselineAvailableSlots = new Set<string>();
          }

          addSlotIds.forEach((slotId) => baseAvailableSlots.add(slotId));
          removeSlotIds.forEach((slotId) => baseAvailableSlots.delete(slotId));

          const orderedNextSlotIds = orderByAllSlotIds(
            baseAvailableSlots,
            allSlotIds,
          );
          const orderedBaselineSlotIds = orderByAllSlotIds(
            baselineAvailableSlots,
            allSlotIds,
          );

          if (
            areOrderedSlotIdsEqual(orderedNextSlotIds, orderedBaselineSlotIds)
          ) {
            return {
              ...old,
              stagedVote: null,
            };
          }

          return {
            ...old,
            stagedVote: {
              slotIds: orderedNextSlotIds,
              baselineSlotIds: orderedBaselineSlotIds,
              updatedAt: new Date().toISOString(),
            },
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          eventDetailKeys.detail(eventId),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });
    },
  });

  const commitMutation = useMutation({
    mutationFn: async () => commitStagedVotesApi(eventId),
    onMutate: async () => {
      setCommitFeedback("idle");
      setCommitShareFeedback("idle");

      await queryClient.cancelQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });

      const currentData = queryClient.getQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
      );

      return {
        hadVotedBeforeCommit: currentData
          ? getCurrentUserHasVoted(currentData, currentUserId)
          : false,
        committedSlotIds: currentData?.stagedVote?.slotIds ?? [],
      };
    },
    onSuccess: async (_response, _variables, context) => {
      queryClient.setQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
        (old) => {
          if (!old) return old;

          const orderedCommittedSlotIds = orderByAllSlotIds(
            new Set(context?.committedSlotIds ?? []),
            old.slots.map((slot) => slot.id),
          );

          const expectedParticipant = old.expectedParticipants.find(
            (item) =>
              item.userId === currentUserId || item.user?.id === currentUserId,
          );

          const userDisplayName =
            expectedParticipant?.user?.displayName ?? "Unknown";

          const orderedCommittedVotes = orderedCommittedSlotIds.map(
            (slotId) => ({
              slotId,
              userId: currentUserId,
              userDisplayName,
            }),
          );

          return {
            ...old,
            stagedVote: null,
            votes: [
              ...old.votes.filter((vote) => vote.userId !== currentUserId),
              ...orderedCommittedVotes,
            ],
          };
        },
      );

      setCommitFeedback("success");

      const liff = await getLiff();
      if (liff?.isInClient() && !context?.hadVotedBeforeCommit) {
        const shareResult = await shareVoteCommitFlexMessage({
          eventId,
          eventTitle,
          voterUserId: currentUserId,
        });
        setCommitShareFeedback(
          shareResult === ShareResult.Success ? "success" : "error",
        );
      } else {
        setCommitShareFeedback("idle");
      }
    },
    onError: () => {
      setCommitFeedback("error");
      setCommitShareFeedback("idle");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });
    },
  });

  const updateStagedVotes = useCallback(
    (addSlotIds: string[], removeSlotIds: string[], voteMode: VoteMode) => {
      if (addSlotIds.length === 0 && removeSlotIds.length === 0) return;
      patchMutation.mutate({ addSlotIds, removeSlotIds, voteMode });
    },
    [patchMutation],
  );

  const commitStagedVotes = useCallback(() => {
    if (commitMutation.isPending) return;
    commitMutation.mutate();
  }, [commitMutation]);

  return {
    committedSlots,
    stagedSlots,
    hasStagedVoteDraft,
    commitFeedback,
    updateStagedVotes,
    commitStagedVotes,
    isPatchPending: patchMutation.isPending,
    isCommitPending: commitMutation.isPending,
    isPending: patchMutation.isPending || commitMutation.isPending,
  };
}
