import { useCallback } from "react";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useAuthContext } from "@/contexts/AuthContext";
import { isEventHost } from "@/lib/eventHost";

export function useUnifiedEventDetail(eventId: string) {
  const { data, isLoading, isFetching, error, refetch } =
    useEventDetail(eventId);
  const { user } = useAuthContext();

  const isHost = isEventHost(user?.id, data?.event.ownerId);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { data, isHost, isLoading, isFetching, error, refetch: handleRefetch };
}
