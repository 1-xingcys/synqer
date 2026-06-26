"use client";

import { apiFetchJson } from "@/lib/apiClient";
import type { operations } from "@/generated/openapi";

type UpdateStagedVoteRequest =
  operations["VotingController_updateStagedVotes"]["requestBody"]["content"]["application/json"];
type UpdateStagedVoteResponse =
  operations["VotingController_updateStagedVotes"]["responses"][200]["content"]["application/json"];
type CommitStagedVoteResponse =
  operations["VotingController_commitStagedVotes"]["responses"][200]["content"]["application/json"];

// Patch staged votes (incremental update for draft)
export async function patchStagedVotesApi(
  eventId: string,
  addSlotIds: string[],
  removeSlotIds: string[],
  voteMode: UpdateStagedVoteRequest["voteMode"],
): Promise<UpdateStagedVoteResponse> {
  const payload: UpdateStagedVoteRequest = {
    addSlotIds,
    removeSlotIds,
    voteMode,
  };

  return apiFetchJson<UpdateStagedVoteResponse>(
    `/events/${eventId}/voting/staged`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

// Commit staged votes
export async function commitStagedVotesApi(
  eventId: string,
): Promise<CommitStagedVoteResponse> {
  return apiFetchJson<CommitStagedVoteResponse>(
    `/events/${eventId}/voting/commit`,
    {
      method: "POST",
    },
  );
}
