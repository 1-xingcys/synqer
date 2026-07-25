import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API;

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
}

interface ConflictingSlots {
  calendarEvents: CalendarEvent[];
  conflictingSlotIds: string[];
}

interface ConnectionStatus {
  connected: boolean;
  googleEmail?: string;
  connectedAt?: string;
}

const googleCalendarKeys = {
  status: ["googleCalendar", "status"] as const,
};

// 取得連結狀態：401 視為「未登入 / 未連結」而非錯誤
async function fetchStatus(): Promise<ConnectionStatus> {
  const res = await apiFetch("/google-calendar/status");

  if (!res.ok) {
    if (res.status === 401) {
      return { connected: false };
    }
    throw new Error("Failed to fetch status");
  }

  return (await res.json()) as ConnectionStatus;
}

export function useGoogleCalendar() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: googleCalendarKeys.status,
    queryFn: fetchStatus,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/google-calendar/disconnect", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<ConnectionStatus>(googleCalendarKeys.status, {
        connected: false,
      });
    },
  });

  // 開始連結流程（瀏覽器導向 OAuth，非資料層請求）
  const connect = useCallback((redirectPath?: string) => {
    const currentPath = redirectPath || window.location.pathname;
    window.location.href = `${API_BASE_URL}/google-calendar/connect?redirect=${encodeURIComponent(currentPath)}`;
  }, []);

  // 斷開連結：錯誤已記錄在 disconnectMutation.error 並由 error 欄位露出，
  // 故吞掉 rejection，避免呼叫端（void disconnectCalendar()）產生未處理的 promise rejection。
  const disconnect = useCallback(async () => {
    try {
      await disconnectMutation.mutateAsync();
    } catch {
      // 錯誤已透過回傳的 error 呈現
    }
  }, [disconnectMutation]);

  // 取得活動的衝突時段：400/401 代表未連結或 token 過期，回 null
  const getConflictingSlots = useCallback(
    async (eventId: string): Promise<ConflictingSlots | null> => {
      try {
        const res = await apiFetch(
          `/google-calendar/events/${eventId}/conflicts`,
        );

        if (!res.ok) {
          if (res.status === 400 || res.status === 401) {
            return null;
          }
          throw new Error("Failed to fetch conflicts");
        }

        return (await res.json()) as ConflictingSlots;
      } catch (err) {
        console.error("Error fetching calendar conflicts:", err);
        return null;
      }
    },
    [],
  );

  const error =
    statusQuery.error instanceof Error
      ? statusQuery.error.message
      : disconnectMutation.error instanceof Error
        ? disconnectMutation.error.message
        : null;

  return {
    status: statusQuery.data ?? null,
    loading: statusQuery.isLoading || disconnectMutation.isPending,
    error,
    connect,
    disconnect,
    getConflictingSlots,
  };
}
