"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { EventStatus, ConfirmedTimeRange } from "@/types/event";

export interface EventPublicInfo {
  isDeleted: boolean;
  id: string;
  title: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  votingDeadline: string | null;
  confirmedSlotIds: string[];
  confirmedTimeRanges: ConfirmedTimeRange[];
  status: EventStatus;
  participantCount: number;
}

export interface ParticipationStatus {
  isParticipant: boolean;
  hasVoted: boolean;
}

export interface UseEventJoinResult {
  eventInfo: EventPublicInfo | null;
  participationStatus: ParticipationStatus | null;
  loading: boolean;
  joining: boolean;
  error: string | null;
  handleJoin: () => Promise<void>;
}

export function useEventJoin(eventId: string): UseEventJoinResult {
  const router = useRouter();
  const [eventInfo, setEventInfo] = useState<EventPublicInfo | null>(null);
  const [participationStatus, setParticipationStatus] =
    useState<ParticipationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API;

        // 取得活動公開資訊
        const eventResponse = await fetch(
          `${apiBase}/events/${eventId}/public`,
        );
        if (!eventResponse.ok) {
          if (eventResponse.status === 404) {
            throw new Error("Event not found");
          }
          throw new Error("Failed to load event");
        }
        const responseData = (await eventResponse.json()) as EventPublicInfo;
        setEventInfo(responseData);

        // 檢查活動是否已被刪除，若已刪除則不需要取得參與狀態
        if (responseData.isDeleted) {
          setLoading(false);
          return;
        }

        // 取得使用者參與狀態
        const participationResponse = await fetch(
          `${apiBase}/events/${eventId}/participation`,
          { credentials: "include" },
        );
        if (participationResponse.ok) {
          const participationData =
            (await participationResponse.json()) as ParticipationStatus;
          setParticipationStatus(participationData);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading event:", err);
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [eventId]);

  const handleJoin = useCallback(async () => {
    try {
      setJoining(true);
      const apiBase = process.env.NEXT_PUBLIC_API;

      const response = await fetch(`${apiBase}/events/${eventId}/join`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to join event");
      }

      // 加入成功，跳轉到投票頁面
      router.push(`/joined/${eventId}`);
    } catch (err) {
      console.error("Error joining event:", err);
      setError(err instanceof Error ? err.message : "Failed to join event");
      setJoining(false);
    }
  }, [eventId, router]);

  return {
    eventInfo,
    participationStatus,
    loading,
    joining,
    error,
    handleJoin,
  };
}
