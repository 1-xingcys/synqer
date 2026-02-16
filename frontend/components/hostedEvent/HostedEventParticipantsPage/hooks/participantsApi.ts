"use client";

import { apiFetchJson } from "@/lib/apiClient";
import type { operations } from "@/generated/openapi";

type UpdateParticipantsRequest =
  operations["ParticipationController_updateParticipants"]["requestBody"]["content"]["application/json"];
type UpdateParticipantsResponse =
  operations["ParticipationController_updateParticipants"]["responses"][200]["content"]["application/json"];
type ParticipantPayloadItem = UpdateParticipantsRequest["participants"][number];

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
