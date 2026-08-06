import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { eventDetailKeys, type EventDetailData } from "@/hooks/useEventDetail";
import { VoteMode } from "@/types/event";
import {
  createPatchStagedVotesMutationOptions,
  type PatchStagedVotesVariables,
} from "./stagedVoteMutations";
import { patchStagedVotesApi } from "./votingApi";

jest.mock("./votingApi", () => ({
  patchStagedVotesApi: jest.fn(),
  commitStagedVotesApi: jest.fn(),
}));

const patchStagedVotesApiMock = jest.mocked(patchStagedVotesApi);

const eventId = "event-1";
const currentUserId = "user-1";

type PatchResponse = Awaited<ReturnType<typeof patchStagedVotesApi>>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Let every already-scheduled microtask and timer callback run. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function seedEventDetail(queryClient: QueryClient) {
  queryClient.setQueryData(eventDetailKeys.detail(eventId), {
    slots: [{ id: "slot-1" }, { id: "slot-2" }, { id: "slot-3" }],
    votes: [],
    stagedVote: null,
    expectedParticipants: [{ userId: currentUserId, hasVoted: false }],
  } as unknown as EventDetailData);
}

function fire(queryClient: QueryClient, variables: PatchStagedVotesVariables) {
  const observer = new MutationObserver(
    queryClient,
    createPatchStagedVotesMutationOptions({
      eventId,
      currentUserId,
      queryClient,
    }),
  );
  // The mutation's own onError handles the failure path; this only keeps an
  // unhandled rejection out of the test run.
  void observer.mutate(variables).catch(() => undefined);
}

const addSlot = (slotId: string): PatchStagedVotesVariables => ({
  addSlotIds: [slotId],
  removeSlotIds: [],
  voteMode: VoteMode.AVAILABLE,
});

describe("createPatchStagedVotesMutationOptions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    seedEventDetail(queryClient);
  });

  it("holds the second patch until the first one has landed", async () => {
    const first = deferred<PatchResponse>();
    const second = deferred<PatchResponse>();
    patchStagedVotesApiMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    fire(queryClient, addSlot("slot-1"));
    fire(queryClient, addSlot("slot-2"));
    await flush();

    // Both drafts are already on screen, but only one request is on the wire:
    // two overlapping PATCHes would both read the same draft server-side, and
    // the later write would drop the earlier one's slots.
    expect(patchStagedVotesApiMock).toHaveBeenCalledTimes(1);

    first.resolve({ success: true, stagedSlotCount: 1 });
    await flush();

    expect(patchStagedVotesApiMock).toHaveBeenCalledTimes(2);

    second.resolve({ success: true, stagedSlotCount: 2 });
    await flush();
  });

  it("refetches once, after the last patch has settled", async () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const first = deferred<PatchResponse>();
    const second = deferred<PatchResponse>();
    patchStagedVotesApiMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    fire(queryClient, addSlot("slot-1"));
    fire(queryClient, addSlot("slot-2"));
    await flush();

    first.resolve({ success: true, stagedSlotCount: 1 });
    await flush();

    // Refetching here would race the queued patch and paint the pre-write
    // server state over the grid for a round trip.
    expect(invalidateSpy).not.toHaveBeenCalled();

    second.resolve({ success: true, stagedSlotCount: 2 });
    await flush();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("stacks a queued patch on the draft of the one in flight", async () => {
    const first = deferred<PatchResponse>();
    const second = deferred<PatchResponse>();
    patchStagedVotesApiMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    fire(queryClient, addSlot("slot-1"));
    fire(queryClient, addSlot("slot-2"));
    await flush();

    const data = queryClient.getQueryData<EventDetailData>(
      eventDetailKeys.detail(eventId),
    );
    expect(data?.stagedVote?.slotIds).toEqual(["slot-1", "slot-2"]);

    first.resolve({ success: true, stagedSlotCount: 1 });
    second.resolve({ success: true, stagedSlotCount: 2 });
    await flush();
  });
});
