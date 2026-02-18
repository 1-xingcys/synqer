"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patchStagedVotesApi,
  commitStagedVotesApi,
  eventDetailKeys,
  EventDetailData,
} from "@/hooks/useEventDetail";
import { Vote, StagedVote } from "../../types";
import { VoteMode } from "@/types/event";

interface UseOptimisticVotingProps {
  eventId: string;
  currentUserId: string;
  currentUserDisplayName: string;
  votes: Vote[];
  stagedVote: StagedVote | null;
}

interface UseOptimisticVotingReturn {
  committedSlots: Set<string>;
  stagedSlots: Set<string>;
  hasStagedVoteDraft: boolean;
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
  currentUserDisplayName,
  votes,
  stagedVote,
}: UseOptimisticVotingProps): UseOptimisticVotingReturn {
  const queryClient = useQueryClient();

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
      await queryClient.cancelQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });

      const previousData = queryClient.getQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
      );

      queryClient.setQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
        (old) => {
          if (!old || !old.stagedVote) return old;

          const stagedSlotSet = new Set(old.stagedVote.slotIds);
          const orderedStagedSlotIds = old.slots
            .map((slot) => slot.id)
            .filter((slotId) => stagedSlotSet.has(slotId));

          const otherVotes = old.votes.filter(
            (vote) => vote.userId !== currentUserId,
          );
          const newUserVotes: Vote[] = orderedStagedSlotIds.map((slotId) => ({
            slotId,
            userId: currentUserId,
            userDisplayName: currentUserDisplayName,
          }));

          const expectedParticipants = old.expectedParticipants.map(
            (participant) => {
              if (
                participant.userId === currentUserId ||
                participant.user?.id === currentUserId
              ) {
                return {
                  ...participant,
                  hasVoted: true,
                };
              }
              return participant;
            },
          );

          return {
            ...old,
            votes: [...otherVotes, ...newUserVotes],
            stagedVote: null,
            expectedParticipants,
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

  const updateStagedVotes = useCallback(
    (addSlotIds: string[], removeSlotIds: string[], voteMode: VoteMode) => {
      if (addSlotIds.length === 0 && removeSlotIds.length === 0) return;
      patchMutation.mutate({ addSlotIds, removeSlotIds, voteMode });
    },
    [patchMutation],
  );

  const commitStagedVotes = useCallback(() => {
    commitMutation.mutate();
  }, [commitMutation]);

  return {
    committedSlots,
    stagedSlots,
    hasStagedVoteDraft,
    updateStagedVotes,
    commitStagedVotes,
    isPatchPending: patchMutation.isPending,
    isCommitPending: commitMutation.isPending,
    isPending: patchMutation.isPending || commitMutation.isPending,
  };
}
