"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventDetailKeys, EventDetailData } from "@/hooks/useEventDetail";
import { commitStagedVotesApi } from "./votingApi";
import {
  createPatchStagedVotesMutationOptions,
  getCurrentUserHasVoted,
  invalidateEventDetailWhenSettled,
  orderByAllSlotIds,
  stagedVoteMutationKey,
  stagedVoteMutationScope,
} from "./stagedVoteMutations";
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
  shareVoteToChat: boolean;
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

/**
 * Whether a committed vote posts its notice flex message into the chat.
 *
 * Three independent reasons to stay silent: the host turned the notice off,
 * there is no chat to post into, or this voter has already announced once and
 * a re-vote should not announce again.
 */
export function shouldShareVoteNotice({
  shareVoteToChat,
  isInLiffClient,
  hadVotedBeforeCommit,
}: {
  shareVoteToChat: boolean;
  isInLiffClient: boolean;
  hadVotedBeforeCommit: boolean;
}): boolean {
  return shareVoteToChat && isInLiffClient && !hadVotedBeforeCommit;
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
  shareVoteToChat,
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

  const patchMutation = useMutation(
    createPatchStagedVotesMutationOptions({
      eventId,
      currentUserId,
      queryClient,
    }),
  );

  // Same queue as the patches: a commit that overtook a queued patch would
  // commit a draft the server has not been told about yet.
  const commitMutation = useMutation({
    mutationKey: stagedVoteMutationKey(eventId),
    scope: stagedVoteMutationScope(eventId),
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
            expectedParticipants: old.expectedParticipants.map((participant) =>
              participant.userId === currentUserId ||
              participant.user?.id === currentUserId
                ? { ...participant, hasVoted: true }
                : participant,
            ),
          };
        },
      );

      setCommitFeedback("success");

      const liff = shareVoteToChat ? await getLiff() : null;
      if (
        shouldShareVoteNotice({
          shareVoteToChat,
          isInLiffClient: liff?.isInClient() ?? false,
          hadVotedBeforeCommit: context?.hadVotedBeforeCommit ?? false,
        })
      ) {
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
    onSettled: () => invalidateEventDetailWhenSettled(queryClient, eventId),
  });

  // useMutation returns a fresh object every render, so depending on the
  // mutation itself would make this callback — and every grid cell's onClick
  // downstream of it — a new identity on every render. `mutate` is the stable
  // part.
  const { mutate: patchStagedVotes } = patchMutation;

  const updateStagedVotes = useCallback(
    (addSlotIds: string[], removeSlotIds: string[], voteMode: VoteMode) => {
      if (addSlotIds.length === 0 && removeSlotIds.length === 0) return;
      patchStagedVotes({ addSlotIds, removeSlotIds, voteMode });
    },
    [patchStagedVotes],
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
