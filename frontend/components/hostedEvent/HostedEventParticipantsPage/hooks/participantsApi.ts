"use client";

import { apiFetchJson } from "@/lib/apiClient";

interface ParticipantPayloadItem {
  lineUserId?: string;
  userId?: string;
}

interface UpdateParticipantsResponse {
  success: boolean;
  count: number;
}

export async function updateEventParticipants(
  eventId: string,
  participants: ParticipantPayloadItem[],
) {
  await apiFetchJson<UpdateParticipantsResponse>(
    `/events/${eventId}/participation/members`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ participants }),
    },
  );
}
