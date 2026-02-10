"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patchVotesApi,
  replaceVotesApi,
  eventDetailKeys,
  EventDetailData,
} from "@/hooks/useEventDetail";
import { Vote } from "../types";

interface UseOptimisticVotingProps {
  eventId: string;
  currentUserId: string;
  currentUserDisplayName: string;
  votes: Vote[];
}

interface UseOptimisticVotingReturn {
  /** 當前使用者已投票的 slot IDs（從 cache 派生） */
  selectedSlots: Set<string>;
  /** 增量更新投票：新增 addSlotIds、移除 removeSlotIds */
  toggleSlots: (addSlotIds: string[], removeSlotIds: string[]) => void;
  /** 全量替換投票（用於 selectAll / clearSelection 等） */
  replaceAllSlots: (slotIds: string[]) => void;
  /** mutation 是否正在進行 */
  isPending: boolean;
}

/**
 * 封裝投票的樂觀更新流程：
 * 從 query cache 派生當前使用者選取，並提供增量/全量 mutation 與回滾機制。
 */
export function useOptimisticVoting({
  eventId,
  currentUserId,
  currentUserDisplayName,
  votes,
}: UseOptimisticVotingProps): UseOptimisticVotingReturn {
  const queryClient = useQueryClient();

  // 從 votes 資料派生當前使用者的已選 slot IDs
  const selectedSlots = useMemo(() => {
    const set = new Set<string>();
    for (const vote of votes) {
      if (vote.userId === currentUserId) {
        set.add(vote.slotId);
      }
    }
    return set;
  }, [votes, currentUserId]);

  // 增量更新 mutation
  const patchMutation = useMutation({
    mutationFn: ({
      addSlotIds,
      removeSlotIds,
    }: {
      addSlotIds: string[];
      removeSlotIds: string[];
    }) => patchVotesApi(eventId, addSlotIds, removeSlotIds),
    onMutate: async ({ addSlotIds, removeSlotIds }) => {
      await queryClient.cancelQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });

      const previousData = queryClient.getQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
      );

      // 樂觀更新 cache
      queryClient.setQueryData<EventDetailData>(
        eventDetailKeys.detail(eventId),
        (old) => {
          if (!old) return old;

          let newVotes = [...old.votes];

          // 移除 removeSlotIds
          if (removeSlotIds.length > 0) {
            const removeSet = new Set(removeSlotIds);
            newVotes = newVotes.filter(
              (v) => !(removeSet.has(v.slotId) && v.userId === currentUserId),
            );
          }

          // 新增 addSlotIds
          if (addSlotIds.length > 0) {
            const existingSlotIds = new Set(
              newVotes
                .filter((v) => v.userId === currentUserId)
                .map((v) => v.slotId),
            );
            for (const slotId of addSlotIds) {
              if (!existingSlotIds.has(slotId)) {
                newVotes.push({
                  slotId,
                  userId: currentUserId,
                  userDisplayName: currentUserDisplayName,
                });
              }
            }
          }

          return { ...old, votes: newVotes };
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
      // 背景同步確保一致性
      void queryClient.invalidateQueries({
        queryKey: eventDetailKeys.detail(eventId),
      });
    },
  });

  // 全量替換 mutation（用於 selectAll / clearSelection）
  const replaceMutation = useMutation({
    mutationFn: async ({ slotIds }: { slotIds: string[] }) =>
      replaceVotesApi(eventId, slotIds, "available"),
    onMutate: async ({ slotIds }) => {
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

          // 移除當前使用者的所有投票
          const otherVotes = old.votes.filter(
            (v) => v.userId !== currentUserId,
          );

          // 新增新的投票
          const newUserVotes: Vote[] = slotIds.map((slotId) => ({
            slotId,
            userId: currentUserId,
            userDisplayName: currentUserDisplayName,
          }));

          return { ...old, votes: [...otherVotes, ...newUserVotes] };
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

  const toggleSlots = useCallback(
    (addSlotIds: string[], removeSlotIds: string[]) => {
      if (addSlotIds.length === 0 && removeSlotIds.length === 0) return;
      patchMutation.mutate({ addSlotIds, removeSlotIds });
    },
    [patchMutation],
  );

  const replaceAllSlots = useCallback(
    (slotIds: string[]) => {
      replaceMutation.mutate({ slotIds });
    },
    [replaceMutation],
  );

  return {
    selectedSlots,
    toggleSlots,
    replaceAllSlots,
    isPending: patchMutation.isPending || replaceMutation.isPending,
  };
}
