import { buildSlotCellDataProjection } from "./useSlotCellDataProjection";
import type { MergedTimeRow, TimeSlot, Vote } from "../../types";

const DATE_A = "2026-08-01";
const DATE_B = "2026-08-02";

const mergedTimeRows: MergedTimeRow[] = [
  { startMinute: 540, endMinute: 570, slotIndices: [0, 1], height: 2 },
  { startMinute: 570, endMinute: 600, slotIndices: [2, 3], height: 2 },
];

function slot(dateKey: string, index: number): TimeSlot {
  return {
    id: `${dateKey}#${index}`,
    axisType: "DATE" as TimeSlot["axisType"],
    axisDate: dateKey,
    startMinute: 540 + index * 15,
    endMinute: 540 + index * 15 + 15,
    index,
  };
}

const slotsByDate: Record<string, TimeSlot[]> = {
  [DATE_A]: [0, 1, 2, 3].map((index) => slot(DATE_A, index)),
  [DATE_B]: [0, 1, 2, 3].map((index) => slot(DATE_B, index)),
};

function vote(slotId: string, userId: string, name: string): Vote {
  return { slotId, userId, userDisplayName: name };
}

function build(votesBySlot: Record<string, Vote[]> = {}) {
  return buildSlotCellDataProjection({
    mergedTimeRows,
    paginatedDates: [DATE_A, DATE_B],
    slotsByDate,
    votesBySlot,
  });
}

describe("buildSlotCellDataProjection", () => {
  it("collects the slot ids each merged cell covers", () => {
    const cell = build().get(`${DATE_A}|0`)!;

    expect(cell.slotIds).toEqual([`${DATE_A}#0`, `${DATE_A}#1`]);
    expect(cell.mergedSlotIdsAttr).toBe(`${DATE_A}#0,${DATE_A}#1`);
  });

  it("covers every cell of the paginated grid", () => {
    expect(build().size).toBe(mergedTimeRows.length * 2);
  });

  it("unions voters across the slots of a merged cell", () => {
    const cell = build({
      [`${DATE_A}#0`]: [vote(`${DATE_A}#0`, "u1", "Mei")],
      [`${DATE_A}#1`]: [vote(`${DATE_A}#1`, "u2", "Kai")],
    }).get(`${DATE_A}|0`)!;

    expect(cell.voters).toEqual(["Mei", "Kai"]);
  });

  it("counts a voter once even when they voted for both halves", () => {
    const cell = build({
      [`${DATE_A}#0`]: [vote(`${DATE_A}#0`, "u1", "Mei")],
      [`${DATE_A}#1`]: [vote(`${DATE_A}#1`, "u1", "Mei")],
    }).get(`${DATE_A}|0`)!;

    expect(cell.voters).toEqual(["Mei"]);
  });

  it("keeps a cell's voters out of its neighbours", () => {
    const projection = build({
      [`${DATE_A}#0`]: [vote(`${DATE_A}#0`, "u1", "Mei")],
    });

    expect(projection.get(`${DATE_A}|0`)!.voters).toEqual(["Mei"]);
    expect(projection.get(`${DATE_A}|1`)!.voters).toEqual([]);
    expect(projection.get(`${DATE_B}|0`)!.voters).toEqual([]);
  });

  it("shares one empty array across every voterless cell", () => {
    const projection = build();

    // Not cosmetic: a fresh [] per cell would break TimeSlotCell's memo.
    expect(projection.get(`${DATE_A}|0`)!.voters).toBe(
      projection.get(`${DATE_B}|1`)!.voters,
    );
  });

  it("tolerates a date whose slots are missing", () => {
    const projection = buildSlotCellDataProjection({
      mergedTimeRows,
      paginatedDates: [DATE_A, "2026-08-09"],
      slotsByDate,
      votesBySlot: {},
    });

    const missing = projection.get("2026-08-09|0")!;
    expect(missing.slotIds).toEqual([]);
    expect(missing.mergedSlotIdsAttr).toBe("");
  });
});
