import {
  buildSlotMatrixRows,
  type BuildSlotMatrixRowsInput,
  type SlotMatrixDragRect,
} from "./slotMatrixCellModel";
import { buildSlotCellDataProjection } from "./useSlotCellDataProjection";
import type {
  CalendarEvent,
  MergedTimeRow,
  SlotMatrixCellViewModel,
  SlotMatrixRowViewModel,
  TimeSlot,
  Vote,
} from "../../types";

const ROW_COUNT = 30;
const DATE_COUNT = 7;

/**
 * The props SlotMatrix hands to TimeSlotCell, which is exactly what its `memo`
 * compares. `satisfies` keeps this list honest: renaming a view model field
 * without updating it stops compiling.
 */
const MEMO_COMPARED_FIELDS = [
  "slot",
  "rowIndex",
  "dateIndex",
  "mergedSlotIdsAttr",
  "isSelected",
  "isPartiallySelected",
  "selectionTone",
  "inRectangle",
  "rectEdgeTop",
  "rectEdgeBottom",
  "rectEdgeLeft",
  "rectEdgeRight",
  "voters",
  "slotCalendarEvents",
  "eventSpanById",
] as const satisfies readonly (keyof SlotMatrixCellViewModel)[];

const EMPTY_CALENDAR_PROJECTION = {
  events: [] as CalendarEvent[],
  eventSpanById: new Map<string, number>(),
};

function dateKeyAt(dateIndex: number): string {
  return `2026-08-${String(dateIndex + 1).padStart(2, "0")}`;
}

function slotId(dateIndex: number, slotIndex: number): string {
  return `${dateKeyAt(dateIndex)}#${slotIndex}`;
}

/** Two 15-minute slots per merged row, i.e. a 30-minute grid. */
function buildFixture() {
  const mergedTimeRows: MergedTimeRow[] = Array.from(
    { length: ROW_COUNT },
    (_, rowIndex) => ({
      startMinute: 540 + rowIndex * 30,
      endMinute: 540 + rowIndex * 30 + 30,
      slotIndices: [rowIndex * 2, rowIndex * 2 + 1],
      height: 2,
    }),
  );

  const paginatedDates = Array.from({ length: DATE_COUNT }, (_, dateIndex) =>
    dateKeyAt(dateIndex),
  );

  const slotsByDate: Record<string, TimeSlot[]> = {};
  for (let dateIndex = 0; dateIndex < DATE_COUNT; dateIndex++) {
    slotsByDate[dateKeyAt(dateIndex)] = Array.from(
      { length: ROW_COUNT * 2 },
      (_, slotIndex) => ({
        id: slotId(dateIndex, slotIndex),
        axisType: "DATE" as TimeSlot["axisType"],
        axisDate: dateKeyAt(dateIndex),
        startMinute: 540 + slotIndex * 15,
        endMinute: 540 + slotIndex * 15 + 15,
        index: slotIndex,
      }),
    );
  }

  return { mergedTimeRows, paginatedDates, slotsByDate };
}

const fixture = buildFixture();

/** Every slot id covered by the given rectangle. */
function slotIdsInRect(rect: SlotMatrixDragRect | null): Set<string> {
  const selection = new Set<string>();
  if (!rect) return selection;

  for (let rowIndex = rect.minRow; rowIndex <= rect.maxRow; rowIndex++) {
    for (let dateIndex = rect.minDate; dateIndex <= rect.maxDate; dateIndex++) {
      for (const slotIndex of fixture.mergedTimeRows[rowIndex].slotIndices) {
        selection.add(slotId(dateIndex, slotIndex));
      }
    }
  }

  return selection;
}

function buildRows({
  dragRect = null,
  displaySelection = new Set<string>(),
  committedDisplaySelection = new Set<string>(),
  hasStagedVoteDraft = false,
  getCellData,
}: Partial<BuildSlotMatrixRowsInput> &
  Pick<BuildSlotMatrixRowsInput, "getCellData">): SlotMatrixRowViewModel[] {
  return buildSlotMatrixRows({
    ...fixture,
    displaySelection,
    committedDisplaySelection,
    hasStagedVoteDraft,
    dragRect,
    getCellData,
    getCalendarProjectionForCell: () => EMPTY_CALENDAR_PROJECTION,
  });
}

function makeGetCellData(votes: Vote[] = []) {
  const votesBySlot: Record<string, Vote[]> = {};
  for (const vote of votes) {
    (votesBySlot[vote.slotId] ??= []).push(vote);
  }

  const projection = buildSlotCellDataProjection({
    ...fixture,
    votesBySlot,
  });

  return (rowIndex: number, dateKey: string) =>
    projection.get(`${dateKey}|${rowIndex}`)!;
}

function cellsByKey(
  rows: SlotMatrixRowViewModel[],
): Map<string, SlotMatrixCellViewModel> {
  return new Map(rows.flatMap((row) => row.cells.map((c) => [c.key, c])));
}

/**
 * How many cells React would have to re-render: a cell counts as changed when
 * any prop `memo` compares fails `Object.is`.
 */
function countCellsWithChangedProps(
  before: SlotMatrixRowViewModel[],
  after: SlotMatrixRowViewModel[],
): number {
  const beforeCells = cellsByKey(before);
  let changed = 0;

  for (const [key, afterCell] of cellsByKey(after)) {
    const beforeCell = beforeCells.get(key);
    if (
      !beforeCell ||
      MEMO_COMPARED_FIELDS.some(
        (field) => !Object.is(beforeCell[field], afterCell[field]),
      )
    ) {
      changed++;
    }
  }

  return changed;
}

describe("buildSlotMatrixRows", () => {
  it("renders every cell of the paginated grid", () => {
    const rows = buildRows({ getCellData: makeGetCellData() });

    expect(rows).toHaveLength(ROW_COUNT);
    expect(rows.flatMap((row) => row.cells)).toHaveLength(
      ROW_COUNT * DATE_COUNT,
    );
  });

  it("carries no hover or long-press state", () => {
    const [cell] = buildRows({ getCellData: makeGetCellData() })[0].cells;

    // Hover is CSS-only; reintroducing it here would make every mouse move
    // rebuild the whole grid again.
    expect(Object.keys(cell)).not.toContain("isHovered");
    expect(Object.keys(cell)).not.toContain("isLongPressed");
  });

  it("changes nothing when rebuilt from identical inputs", () => {
    const getCellData = makeGetCellData();
    const displaySelection = slotIdsInRect({
      minRow: 2,
      maxRow: 6,
      minDate: 1,
      maxDate: 3,
    });

    const before = buildRows({ getCellData, displaySelection });
    const after = buildRows({ getCellData, displaySelection });

    expect(countCellsWithChangedProps(before, after)).toBe(0);
  });

  it("only changes the moving edge when a drag grows by one column", () => {
    const getCellData = makeGetCellData();

    const beforeRect: SlotMatrixDragRect = {
      minRow: 0,
      maxRow: 4,
      minDate: 0,
      maxDate: 4,
    };
    const afterRect: SlotMatrixDragRect = { ...beforeRect, maxDate: 5 };

    const before = buildRows({
      getCellData,
      dragRect: beforeRect,
      displaySelection: slotIdsInRect(beforeRect),
    });
    const after = buildRows({
      getCellData,
      dragRect: afterRect,
      displaySelection: slotIdsInRect(afterRect),
    });

    // 5 cells enter the rectangle, and the 5 that were the right edge stop
    // being it. Nothing else in the 210-cell grid moves.
    expect(countCellsWithChangedProps(before, after)).toBe(10);
  });

  it("only changes the moving edge when a drag grows by one row", () => {
    const getCellData = makeGetCellData();

    const beforeRect: SlotMatrixDragRect = {
      minRow: 3,
      maxRow: 8,
      minDate: 2,
      maxDate: 4,
    };
    const afterRect: SlotMatrixDragRect = { ...beforeRect, maxRow: 9 };

    const before = buildRows({
      getCellData,
      dragRect: beforeRect,
      displaySelection: slotIdsInRect(beforeRect),
    });
    const after = buildRows({
      getCellData,
      dragRect: afterRect,
      displaySelection: slotIdsInRect(afterRect),
    });

    // 3 cells enter, 3 stop being the bottom edge.
    expect(countCellsWithChangedProps(before, after)).toBe(6);
  });

  it("keeps voter and calendar references across a drag step", () => {
    const getCellData = makeGetCellData([
      { slotId: slotId(6, 40), userId: "u1", userDisplayName: "Mei" },
    ]);

    const beforeRect: SlotMatrixDragRect = {
      minRow: 0,
      maxRow: 1,
      minDate: 0,
      maxDate: 1,
    };
    const before = buildRows({ getCellData, dragRect: beforeRect });
    const after = buildRows({
      getCellData,
      dragRect: { ...beforeRect, maxDate: 2 },
    });

    // Cell (row 20, date 6) is nowhere near the drag and holds the only vote.
    const key = `${dateKeyAt(6)}-20`;
    const beforeCell = cellsByKey(before).get(key)!;
    const afterCell = cellsByKey(after).get(key)!;

    expect(beforeCell.voters).toEqual(["Mei"]);
    expect(afterCell.voters).toBe(beforeCell.voters);
    expect(afterCell.slotCalendarEvents).toBe(beforeCell.slotCalendarEvents);
    expect(afterCell.eventSpanById).toBe(beforeCell.eventSpanById);
  });

  it("marks a cell selected only when every slot it merges is selected", () => {
    const getCellData = makeGetCellData();
    const rowIndex = 4;
    const dateIndex = 2;
    const [firstSlotIndex, secondSlotIndex] =
      fixture.mergedTimeRows[rowIndex].slotIndices;

    const partial = buildRows({
      getCellData,
      displaySelection: new Set([slotId(dateIndex, firstSlotIndex)]),
    });
    const full = buildRows({
      getCellData,
      displaySelection: new Set([
        slotId(dateIndex, firstSlotIndex),
        slotId(dateIndex, secondSlotIndex),
      ]),
    });

    const key = `${dateKeyAt(dateIndex)}-${rowIndex}`;
    const partialCell = cellsByKey(partial).get(key)!;
    const fullCell = cellsByKey(full).get(key)!;

    expect(partialCell.isSelected).toBe(false);
    expect(partialCell.isPartiallySelected).toBe(true);
    expect(partialCell.selectionTone).toBe("none");
    expect(fullCell.isSelected).toBe(true);
    expect(fullCell.isPartiallySelected).toBe(false);
  });

  it("tones a selected cell as staged only when it differs from the committed vote", () => {
    const getCellData = makeGetCellData();
    const rect: SlotMatrixDragRect = {
      minRow: 0,
      maxRow: 0,
      minDate: 0,
      maxDate: 0,
    };
    const displaySelection = slotIdsInRect(rect);
    const key = `${dateKeyAt(0)}-0`;

    const matchingCommit = buildRows({
      getCellData,
      displaySelection,
      committedDisplaySelection: displaySelection,
      hasStagedVoteDraft: true,
    });
    const newlyStaged = buildRows({
      getCellData,
      displaySelection,
      committedDisplaySelection: new Set<string>(),
      hasStagedVoteDraft: true,
    });
    const noDraft = buildRows({
      getCellData,
      displaySelection,
      committedDisplaySelection: new Set<string>(),
      hasStagedVoteDraft: false,
    });

    expect(cellsByKey(matchingCommit).get(key)!.selectionTone).toBe(
      "committed",
    );
    expect(cellsByKey(newlyStaged).get(key)!.selectionTone).toBe("staged");
    expect(cellsByKey(noDraft).get(key)!.selectionTone).toBe("committed");
  });

  it("flags only the outer edges of the drag rectangle", () => {
    const getCellData = makeGetCellData();
    const rect: SlotMatrixDragRect = {
      minRow: 1,
      maxRow: 3,
      minDate: 1,
      maxDate: 3,
    };
    const cells = cellsByKey(buildRows({ getCellData, dragRect: rect }));

    const topLeft = cells.get(`${dateKeyAt(1)}-1`)!;
    expect(topLeft.inRectangle).toBe(true);
    expect(topLeft.rectEdgeTop).toBe(true);
    expect(topLeft.rectEdgeLeft).toBe(true);
    expect(topLeft.rectEdgeBottom).toBe(false);
    expect(topLeft.rectEdgeRight).toBe(false);

    const middle = cells.get(`${dateKeyAt(2)}-2`)!;
    expect(middle.inRectangle).toBe(true);
    expect(middle.rectEdgeTop).toBe(false);
    expect(middle.rectEdgeBottom).toBe(false);
    expect(middle.rectEdgeLeft).toBe(false);
    expect(middle.rectEdgeRight).toBe(false);

    const outside = cells.get(`${dateKeyAt(5)}-5`)!;
    expect(outside.inRectangle).toBe(false);
    expect(outside.rectEdgeTop).toBe(false);
  });

  it("reports no rectangle when no drag is in progress", () => {
    const cells = cellsByKey(
      buildRows({ getCellData: makeGetCellData(), dragRect: null }),
    );

    expect(
      [...cells.values()].every(
        (cell) => !cell.inRectangle && !cell.rectEdgeTop,
      ),
    ).toBe(true);
  });
});
