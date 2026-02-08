import { describe, expect, it } from "@jest/globals";
import { VoteMode } from "../../../../types/event";
import {
  projectSelectionForMode,
  mapDisplayDiffToAvailableDiff,
  getClearSelectionAvailableSlotIds,
  getSelectAllAvailableSlotIds,
  getMarkUnavailableDiff,
} from "./selection";

describe("selection domain", () => {
  it("projects available selection for both modes", () => {
    const available = new Set(["s1", "s3"]);
    const allSlotIds = ["s1", "s2", "s3", "s4"];

    const availableMode = projectSelectionForMode(
      available,
      allSlotIds,
      VoteMode.AVAILABLE,
    );
    const unavailableMode = projectSelectionForMode(
      available,
      allSlotIds,
      VoteMode.UNAVAILABLE,
    );

    expect([...availableMode].sort()).toEqual(["s1", "s3"]);
    expect([...unavailableMode].sort()).toEqual(["s2", "s4"]);
  });

  it("maps diffs correctly by mode", () => {
    const addDisplay = ["s1", "s2"];
    const removeDisplay = ["s3"];

    const availableMode = mapDisplayDiffToAvailableDiff(
      VoteMode.AVAILABLE,
      addDisplay,
      removeDisplay,
    );
    const unavailableMode = mapDisplayDiffToAvailableDiff(
      VoteMode.UNAVAILABLE,
      addDisplay,
      removeDisplay,
    );

    expect(availableMode).toEqual({
      addSlotIds: ["s1", "s2"],
      removeSlotIds: ["s3"],
    });
    expect(unavailableMode).toEqual({
      addSlotIds: ["s3"],
      removeSlotIds: ["s1", "s2"],
    });
  });

  it("returns canonical available selection for clear/select all helpers", () => {
    const allSlotIds = ["s1", "s2", "s3"];

    expect(
      getClearSelectionAvailableSlotIds(VoteMode.AVAILABLE, allSlotIds),
    ).toEqual([]);
    expect(
      getClearSelectionAvailableSlotIds(VoteMode.UNAVAILABLE, allSlotIds),
    ).toEqual(allSlotIds);

    expect(
      getSelectAllAvailableSlotIds(VoteMode.AVAILABLE, allSlotIds),
    ).toEqual(allSlotIds);
    expect(
      getSelectAllAvailableSlotIds(VoteMode.UNAVAILABLE, allSlotIds),
    ).toEqual([]);
  });

  it("removes only currently available slots when marking unavailable", () => {
    const available = new Set(["s1", "s3"]);
    const diff = getMarkUnavailableDiff(available, ["s2", "s3", "s4"]);

    expect(diff).toEqual({
      addSlotIds: [],
      removeSlotIds: ["s3"],
    });
  });
});
