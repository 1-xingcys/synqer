import { useCallback } from "react";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useAuth } from "@/hooks/useAuth";
import { isEventHost } from "@/lib/eventHost";

export function useEventDetailWithRole(eventId: string) {
  const { data, isLoading, isFetching, error, refetch } =
    useEventDetail(eventId);
  const { user } = useAuth();

  const isHost = isEventHost(user?.id, data?.event.ownerId);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { data, isHost, isLoading, isFetching, error, refetch: handleRefetch };
}
