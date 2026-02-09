"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { MergedTimeRow } from "../types";

interface MergedTimeGridPosition {
  rowIndex: number;
  dateIndex: number;
}

interface UseMergedTimeGridSelectionInteractionProps {
  selectedSlots: Set<string>;
  mergedTimeRows: MergedTimeRow[];
  slotsByDate: Record<string, { id: string }[]>;
  paginatedDates: string[];
  /** 拖曳/點擊結束時的 callback，傳入新增與移除的 slot IDs */
  onSelectionCommit: (addSlotIds: string[], removeSlotIds: string[]) => void;
}

interface UseMergedTimeGridSelectionInteractionReturn {
  isDragging: boolean;
  hoveredCell: MergedTimeGridPosition | null;
  longPressCell: MergedTimeGridPosition | null;
  displaySelection: Set<string>;

  handleMouseDown: (
    rowIndex: number,
    dateIndex: number,
    e: React.MouseEvent,
  ) => void;
  handleMouseEnter: (rowIndex: number, dateIndex: number) => void;
  handleMouseUp: () => void;
  handleTouchStart: (
    rowIndex: number,
    dateIndex: number,
    e: React.TouchEvent,
  ) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleClick: (rowIndex: number, dateIndex: number) => void;
  setHoveredCell: (cell: MergedTimeGridPosition | null) => void;
  isInDragRectangle: (rowIndex: number, dateIndex: number) => boolean;
  getRectangleBounds: () => {
    minRow: number;
    maxRow: number;
    minDate: number;
    maxDate: number;
  } | null;
}

/**
 * 計算兩個 Set 的差異
 */
function computeDiff(
  base: Set<string>,
  next: Set<string>,
): { addSlotIds: string[]; removeSlotIds: string[] } {
  const addSlotIds: string[] = [];
  const removeSlotIds: string[] = [];

  for (const id of next) {
    if (!base.has(id)) addSlotIds.push(id);
  }
  for (const id of base) {
    if (!next.has(id)) removeSlotIds.push(id);
  }

  return { addSlotIds, removeSlotIds };
}

/**
 * 管理合併時間列的互動狀態：
 * 處理滑鼠/觸控拖曳、單格點擊、預覽選取與 commit diff 的整套流程。
 */
export function useMergedTimeGridSelectionInteraction({
  selectedSlots,
  mergedTimeRows,
  slotsByDate,
  paginatedDates,
  onSelectionCommit,
}: UseMergedTimeGridSelectionInteractionProps): UseMergedTimeGridSelectionInteractionReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<MergedTimeGridPosition | null>(
    null,
  );
  const [dragEnd, setDragEnd] = useState<MergedTimeGridPosition | null>(null);
  const [baseSelection, setBaseSelection] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<MergedTimeGridPosition | null>(
    null,
  );
  const [longPressCell, setLongPressCell] =
    useState<MergedTimeGridPosition | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  // Guard against duplicate commits from local + global mouseup handlers.
  const hasCommittedRef = useRef(false);

  // Get all slot IDs for a merged cell
  const getSlotIdsForCell = useCallback(
    (rowIndex: number, dateIndex: number): string[] => {
      const row = mergedTimeRows[rowIndex];
      const dateKey = paginatedDates[dateIndex];
      if (!row || !dateKey) return [];

      return row.slotIndices
        .map((idx) => slotsByDate[dateKey]?.[idx]?.id)
        .filter(Boolean);
    },
    [mergedTimeRows, paginatedDates, slotsByDate],
  );

  // Check if a merged cell is fully selected in a given selection set
  const isCellFullySelected = useCallback(
    (rowIndex: number, dateIndex: number, selection: Set<string>): boolean => {
      const slotIds = getSlotIdsForCell(rowIndex, dateIndex);
      return slotIds.length > 0 && slotIds.every((id) => selection.has(id));
    },
    [getSlotIdsForCell],
  );

  // Get cells in rectangle
  const getCellsInRectangle = useCallback(
    (
      start: MergedTimeGridPosition,
      end: MergedTimeGridPosition,
    ): MergedTimeGridPosition[] => {
      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);
      const minDate = Math.min(start.dateIndex, end.dateIndex);
      const maxDate = Math.max(start.dateIndex, end.dateIndex);

      const cells: MergedTimeGridPosition[] = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let date = minDate; date <= maxDate; date++) {
          cells.push({ rowIndex: row, dateIndex: date });
        }
      }
      return cells;
    },
    [],
  );

  // Calculate preview selection
  const previewSelection = useMemo(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      return selectedSlots;
    }

    const cells = getCellsInRectangle(dragStart, dragEnd);
    const newSelection = new Set(baseSelection);

    cells.forEach((cell) => {
      const slotIds = getSlotIdsForCell(cell.rowIndex, cell.dateIndex);
      const wasFullySelected = isCellFullySelected(
        cell.rowIndex,
        cell.dateIndex,
        baseSelection,
      );

      if (wasFullySelected) {
        // Remove all slots (toggle off)
        slotIds.forEach((id) => newSelection.delete(id));
      } else {
        // Add all slots (toggle on)
        slotIds.forEach((id) => newSelection.add(id));
      }
    });

    return newSelection;
  }, [
    isDragging,
    dragStart,
    dragEnd,
    baseSelection,
    getCellsInRectangle,
    getSlotIdsForCell,
    isCellFullySelected,
    selectedSlots,
  ]);

  const displaySelection = isDragging ? previewSelection : selectedSlots;

  // Check if cell is in current drag rectangle
  const isInDragRectangle = useCallback(
    (rowIndex: number, dateIndex: number): boolean => {
      if (!isDragging || !dragStart || !dragEnd) return false;

      const minRow = Math.min(dragStart.rowIndex, dragEnd.rowIndex);
      const maxRow = Math.max(dragStart.rowIndex, dragEnd.rowIndex);
      const minDate = Math.min(dragStart.dateIndex, dragEnd.dateIndex);
      const maxDate = Math.max(dragStart.dateIndex, dragEnd.dateIndex);

      return (
        rowIndex >= minRow &&
        rowIndex <= maxRow &&
        dateIndex >= minDate &&
        dateIndex <= maxDate
      );
    },
    [isDragging, dragStart, dragEnd],
  );

  // Get rectangle bounds
  const getRectangleBounds = useCallback(() => {
    if (!dragStart || !dragEnd) return null;
    return {
      minRow: Math.min(dragStart.rowIndex, dragEnd.rowIndex),
      maxRow: Math.max(dragStart.rowIndex, dragEnd.rowIndex),
      minDate: Math.min(dragStart.dateIndex, dragEnd.dateIndex),
      maxDate: Math.max(dragStart.dateIndex, dragEnd.dateIndex),
    };
  }, [dragStart, dragEnd]);

  // Commit the selection diff and reset drag state
  const commitAndReset = useCallback(
    (preview: Set<string>, base: Set<string>) => {
      const { addSlotIds, removeSlotIds } = computeDiff(base, preview);
      if (addSlotIds.length > 0 || removeSlotIds.length > 0) {
        onSelectionCommit(addSlotIds, removeSlotIds);
      }
    },
    [onSelectionCommit],
  );

  const commitDragPreview = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd || hasCommittedRef.current) {
      return;
    }

    // Single click on same cell is handled by onClick.
    const isSameCell =
      dragStart.rowIndex === dragEnd.rowIndex &&
      dragStart.dateIndex === dragEnd.dateIndex;

    if (isSameCell) {
      return;
    }

    commitAndReset(previewSelection, baseSelection);
    hasCommittedRef.current = true;
  }, [
    isDragging,
    dragStart,
    dragEnd,
    previewSelection,
    baseSelection,
    commitAndReset,
  ]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (rowIndex: number, dateIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      hasCommittedRef.current = false;
      setIsDragging(true);
      setDragStart({ rowIndex, dateIndex });
      setDragEnd({ rowIndex, dateIndex });
      setBaseSelection(new Set(selectedSlots));
    },
    [selectedSlots],
  );

  const handleMouseEnter = useCallback(
    (rowIndex: number, dateIndex: number) => {
      setHoveredCell({ rowIndex, dateIndex });
      if (isDragging) {
        setDragEnd({ rowIndex, dateIndex });
      }
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    commitDragPreview();
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [commitDragPreview]);

  // Click handler for single cell toggle
  const handleClick = useCallback(
    (rowIndex: number, dateIndex: number) => {
      const slotIds = getSlotIdsForCell(rowIndex, dateIndex);
      if (slotIds.length === 0) return;

      const isFullySelected = isCellFullySelected(
        rowIndex,
        dateIndex,
        selectedSlots,
      );

      if (isFullySelected) {
        // Remove these slots
        onSelectionCommit([], slotIds);
      } else {
        // Add these slots
        onSelectionCommit(slotIds, []);
      }
    },
    [getSlotIdsForCell, isCellFullySelected, selectedSlots, onSelectionCommit],
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (rowIndex: number, dateIndex: number, e: React.TouchEvent) => {
      e.preventDefault();
      hasCommittedRef.current = false;

      longPressTimer.current = setTimeout(() => {
        setLongPressCell({ rowIndex, dateIndex });
      }, 500);

      setIsDragging(true);
      setDragStart({ rowIndex, dateIndex });
      setDragEnd({ rowIndex, dateIndex });
      setBaseSelection(new Set(selectedSlots));
    },
    [selectedSlots],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!isDragging) return;

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      // Get row and date indices from data attributes
      const rowIndexStr = element?.getAttribute("data-row-index");
      const dateIndexStr = element?.getAttribute("data-date-index");

      if (rowIndexStr != null && dateIndexStr != null) {
        const rowIndex = parseInt(rowIndexStr, 10);
        const dateIndex = parseInt(dateIndexStr, 10);
        if (!isNaN(rowIndex) && !isNaN(dateIndex)) {
          setDragEnd({ rowIndex, dateIndex });
        }
      }
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    commitDragPreview();

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => setLongPressCell(null), 100);
  }, [commitDragPreview]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      commitDragPreview();
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [commitDragPreview]);

  return {
    isDragging,
    hoveredCell,
    longPressCell,
    displaySelection,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    setHoveredCell,
    isInDragRectangle,
    getRectangleBounds,
  };
}
