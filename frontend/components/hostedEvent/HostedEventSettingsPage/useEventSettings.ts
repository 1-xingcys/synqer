import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/apiClient";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";
import { myEventsKeys } from "@/hooks/useMyEvents";
import type { operations } from "@/generated/openapi";

type RemoveEventResponse =
  operations["EventCoreController_remove"]["responses"][200]["content"]["application/json"];

export function useEventSettings(eventId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteEvent = useCallback(async () => {
    await apiFetchJson<RemoveEventResponse>(`/events/${eventId}`, {
      method: "DELETE",
    });
  }, [eventId]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await deleteEvent();
      await queryClient.invalidateQueries({ queryKey: myEventsKeys.all });

      router.push(DEFAULT_OVERVIEW_PATH);
    } catch (error) {
      console.error("Failed to delete event:", error);
      setDeleting(false);
    }
  }, [deleteEvent, queryClient, router]);

  const toggleDeleteConfirm = useCallback((show: boolean) => {
    setShowDeleteConfirm(show);
  }, []);

  return {
    deleting,
    showDeleteConfirm,
    handleDelete,
    toggleDeleteConfirm,
  };
}
