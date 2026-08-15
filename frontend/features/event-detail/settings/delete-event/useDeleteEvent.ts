"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetchJson } from "@/lib/api/apiClient";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/routing/eventRoutes";
import { myEventsKeys } from "@/hooks/useMyEvents";
import type { operations } from "@/generated/openapi";

type RemoveEventResponse =
  operations["EventCoreController_remove"]["responses"][200]["content"]["application/json"];

export function useDeleteEvent() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const requestDelete = useCallback(() => setShowConfirm(true), []);
  const cancelDelete = useCallback(() => setShowConfirm(false), []);

  const confirmDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await apiFetchJson<RemoveEventResponse>(`/events/${eventId}`, {
        method: "DELETE",
      });
      await queryClient.invalidateQueries({ queryKey: myEventsKeys.all });

      router.push(DEFAULT_OVERVIEW_PATH);
    } catch (error) {
      console.error("Failed to delete event:", error);
      setDeleting(false);
    }
  }, [eventId, queryClient, router]);

  return {
    deleting,
    showConfirm,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
