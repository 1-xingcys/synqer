import { useState, useCallback, useEffect } from "react";

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

export function useGoogleCalendar() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 取得連結狀態
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/google-calendar/status`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          // 未登入
          setStatus({ connected: false });
          return;
        }
        throw new Error("Failed to fetch status");
      }

      const data: ConnectionStatus = (await res.json()) as ConnectionStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化時取得狀態
  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // 開始連結流程
  const connect = useCallback((redirectPath?: string) => {
    const currentPath = redirectPath || window.location.pathname;
    window.location.href = `${API_BASE_URL}/google-calendar/connect?redirect=${encodeURIComponent(currentPath)}`;
  }, []);

  // 斷開連結
  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/google-calendar/disconnect`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }

      setStatus({ connected: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 取得活動的衝突時段
  const getConflictingSlots = useCallback(
    async (eventId: string): Promise<ConflictingSlots | null> => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/google-calendar/events/${eventId}/conflicts`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          if (res.status === 400 || res.status === 401) {
            // Calendar 未連結或 token 過期
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

  return {
    status,
    loading,
    error,
    connect,
    disconnect,
    getConflictingSlots,
    refetchStatus: fetchStatus,
  };
}

// 工具函數：檢查時段是否與 Calendar 事件衝突
export function checkSlotConflict(
  slotDate: Date,
  startMinute: number,
  endMinute: number,
  calendarEvents: CalendarEvent[],
): CalendarEvent | null {
  // 計算 slot 的實際時間
  const slotStart = new Date(slotDate);
  slotStart.setHours(0, 0, 0, 0);
  slotStart.setMinutes(startMinute);

  const slotEnd = new Date(slotDate);
  slotEnd.setHours(0, 0, 0, 0);
  slotEnd.setMinutes(endMinute);

  // 檢查是否有衝突的 Calendar 事件
  for (const event of calendarEvents) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // 檢查時間重疊
    if (slotStart < eventEnd && slotEnd > eventStart) {
      return event;
    }
  }

  return null;
}
