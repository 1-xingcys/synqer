"use client";

import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { eventDetailKeys, EventDetailData } from "@/hooks/useEventDetail";
import { patchStagedVotesApi } from "./votingApi";
import { VoteMode } from "@/types/event";

export interface PatchStagedVotesVariables {
  addSlotIds: string[];
  removeSlotIds: string[];
  voteMode: VoteMode;
}

interface PatchStagedVotesContext {
  previousData: EventDetailData | undefined;
}

type PatchStagedVotesResponse = Awaited<ReturnType<typeof patchStagedVotesApi>>;

/**
 * One key for every staged-vote mutation of an event, so a settling mutation
 * can tell whether a sibling is still queued behind it.
 */
export const stagedVoteMutationKey = (eventId: string) =>
  ["stagedVote", eventId] as const;

/**
 * One scope for every staged-vote mutation of an event.
 *
 * React Query runs same-scope mutations one at a time. `onMutate` still fires
 * the moment the cell is clicked, so the grid stays instant — only the request
 * waits. Two PATCHes in flight at once would each read the same draft on the
 * server, and the later write would drop the earlier one's slots.
 */
export const stagedVoteMutationScope = (eventId: string) => ({
  id: `stagedVote:${eventId}`,
});

/**
 * Refetch the event detail once the staged-vote mutations have gone quiet.
 *
 * `onSettled` runs while its own mutation still counts as pending, so a count
 * above one means another one is queued behind it. Refetching then would race
 * that mutation's write and paint the pre-write server state over the grid
 * until the next round trip corrects it.
 */
export function invalidateEventDetailWhenSettled(
  queryClient: QueryClient,
  eventId: string,
): void {
  if (
    queryClient.isMutating({ mutationKey: stagedVoteMutationKey(eventId) }) > 1
  ) {
    return;
  }

  void queryClient.invalidateQueries({
    queryKey: eventDetailKeys.detail(eventId),
  });
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

export function getCurrentUserHasVoted(
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

export function orderByAllSlotIds(
  slotIdSet: Set<string>,
  allSlotIds: string[],
): string[] {
  return allSlotIds.filter((slotId) => slotIdSet.has(slotId));
}

function areOrderedSlotIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((slotId, index) => slotId === right[index]);
}

export function createPatchStagedVotesMutationOptions({
  eventId,
  currentUserId,
  queryClient,
}: {
  eventId: string;
  currentUserId: string;
  queryClient: QueryClient;
}): UseMutationOptions<
  PatchStagedVotesResponse,
  Error,
  PatchStagedVotesVariables,
  PatchStagedVotesContext
> {
  return {
    mutationKey: stagedVoteMutationKey(eventId),
    scope: stagedVoteMutationScope(eventId),
    mutationFn: ({ addSlotIds, removeSlotIds, voteMode }) =>
      patchStagedVotesApi(eventId, addSlotIds, removeSlotIds, voteMode),
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
    onSettled: () => invalidateEventDetailWhenSettled(queryClient, eventId),
  };
}
