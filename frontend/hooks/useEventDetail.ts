import { useQuery } from "@tanstack/react-query";
import type { operations } from "@/generated/openapi";

type EventDetailResponse =
  operations["EventCoreController_findOne"]["responses"][200]["content"]["application/json"];
export type EventDetailData = EventDetailResponse;
type VoteEventRequest =
  operations["VotingController_vote"]["requestBody"]["content"]["application/json"];
type VoteEventResponse =
  operations["VotingController_vote"]["responses"][200]["content"]["application/json"];
type UpdateVoteRequest =
  operations["VotingController_updateVotes"]["requestBody"]["content"]["application/json"];
type UpdateVoteResponse =
  operations["VotingController_updateVotes"]["responses"][200]["content"]["application/json"];
type UpdateStagedVoteRequest =
  operations["VotingController_updateStagedVotes"]["requestBody"]["content"]["application/json"];
type UpdateStagedVoteResponse =
  operations["VotingController_updateStagedVotes"]["responses"][200]["content"]["application/json"];
type CommitStagedVoteResponse =
  operations["VotingController_commitStagedVotes"]["responses"][200]["content"]["application/json"];

// Query key factory for event detail
export const eventDetailKeys = {
  all: ["eventDetail"] as const,
  detail: (eventId: string) => [...eventDetailKeys.all, eventId] as const,
};

// Fetch function
async function fetchEventDetail(eventId: string): Promise<EventDetailResponse> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch event data");
  }

  return response.json() as Promise<EventDetailResponse>;
}

// Patch votes function (incremental update)
export async function patchVotesApi(
  eventId: string,
  addSlotIds: string[],
  removeSlotIds: string[],
): Promise<UpdateVoteResponse> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const payload: UpdateVoteRequest = {
    addSlotIds,
    removeSlotIds,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/voting`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(errorData.message || "Failed to update votes");
  }

  return response.json() as Promise<UpdateVoteResponse>;
}

// Replace votes function (full update)
export async function replaceVotesApi(
  eventId: string,
  selectedSlotIds: string[],
  voteMode: VoteEventRequest["voteMode"] = "available",
): Promise<VoteEventResponse> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const payload: VoteEventRequest = {
    selectedSlotIds,
    voteMode,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/voting`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(errorData.message || "Failed to save votes");
  }

  return response.json() as Promise<VoteEventResponse>;
}

// Patch staged votes function (incremental update for draft)
export async function patchStagedVotesApi(
  eventId: string,
  addSlotIds: string[],
  removeSlotIds: string[],
  voteMode: UpdateStagedVoteRequest["voteMode"],
): Promise<UpdateStagedVoteResponse> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const payload: UpdateStagedVoteRequest = {
    addSlotIds,
    removeSlotIds,
    voteMode,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/voting/staged`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(errorData.message || "Failed to update staged votes");
  }

  return response.json() as Promise<UpdateStagedVoteResponse>;
}

// Commit staged votes function
export async function commitStagedVotesApi(
  eventId: string,
): Promise<CommitStagedVoteResponse> {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/events/${eventId}/voting/commit`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(errorData.message || "Failed to commit staged votes");
  }

  return response.json() as Promise<CommitStagedVoteResponse>;
}

export function useEventDetail(eventId: string) {
  const query = useQuery({
    queryKey: eventDetailKeys.detail(eventId),
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
