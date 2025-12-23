"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { MergedTimeRow } from "../types";

interface MergedRowPosition {
  rowIndex: number;
  dateIndex: number;
}

interface UseMergedRowDragSelectionProps {
  selectedSlots: Set<string>;
  setSelectedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
  mergedRows: MergedTimeRow[];
  slotsByDate: Record<string, { id: string }[]>;
  paginatedDates: string[];
}

interface UseMergedRowDragSelectionReturn {
  isDragging: boolean;
  dragStart: MergedRowPosition | null;
  dragEnd: MergedRowPosition | null;
  hoveredCell: MergedRowPosition | null;
  longPressCell: MergedRowPosition | null;
  previewSelection: Set<string>;
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
  setHoveredCell: (cell: MergedRowPosition | null) => void;
  isInDragRectangle: (rowIndex: number, dateIndex: number) => boolean;
  getRectangleBounds: () => {
    minRow: number;
    maxRow: number;
    minDate: number;
    maxDate: number;
  } | null;
}

export function useMergedRowDragSelection({
  selectedSlots,
  setSelectedSlots,
  mergedRows,
  slotsByDate,
  paginatedDates,
}: UseMergedRowDragSelectionProps): UseMergedRowDragSelectionReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<MergedRowPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<MergedRowPosition | null>(null);
  const [baseSelection, setBaseSelection] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<MergedRowPosition | null>(
    null,
  );
  const [longPressCell, setLongPressCell] = useState<MergedRowPosition | null>(
    null,
  );

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Get all slot IDs for a merged cell
  const getSlotIdsForCell = useCallback(
    (rowIndex: number, dateIndex: number): string[] => {
      const row = mergedRows[rowIndex];
      const dateKey = paginatedDates[dateIndex];
      if (!row || !dateKey) return [];

      return row.slotIndices
        .map((idx) => slotsByDate[dateKey]?.[idx]?.id)
        .filter(Boolean);
    },
    [mergedRows, paginatedDates, slotsByDate],
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
    (start: MergedRowPosition, end: MergedRowPosition): MergedRowPosition[] => {
      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);
      const minDate = Math.min(start.dateIndex, end.dateIndex);
      const maxDate = Math.max(start.dateIndex, end.dateIndex);

      const cells: MergedRowPosition[] = [];
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

  // Mouse handlers
  const handleMouseDown = useCallback(
    (rowIndex: number, dateIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
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
    // Single click on same cell is handled by onClick
    const isSameCell =
      dragStart &&
      dragEnd &&
      dragStart.rowIndex === dragEnd.rowIndex &&
      dragStart.dateIndex === dragEnd.dateIndex;

    if (isDragging && dragStart && dragEnd && !isSameCell) {
      setSelectedSlots(previewSelection);
      setBaseSelection(previewSelection);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, previewSelection, setSelectedSlots]);

  // Click handler for single cell toggle
  const handleClick = useCallback(
    (rowIndex: number, dateIndex: number) => {
      const slotIds = getSlotIdsForCell(rowIndex, dateIndex);
      const isFullySelected = isCellFullySelected(
        rowIndex,
        dateIndex,
        selectedSlots,
      );

      setSelectedSlots((prev) => {
        const newSet = new Set(prev);
        if (isFullySelected) {
          slotIds.forEach((id) => newSet.delete(id));
        } else {
          slotIds.forEach((id) => newSet.add(id));
        }
        return newSet;
      });
    },
    [getSlotIdsForCell, isCellFullySelected, selectedSlots, setSelectedSlots],
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (rowIndex: number, dateIndex: number, e: React.TouchEvent) => {
      e.preventDefault();

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

      if (rowIndexStr !== null && dateIndexStr !== null) {
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

    // Single tap on same cell is handled by onClick
    const isSameCell =
      dragStart &&
      dragEnd &&
      dragStart.rowIndex === dragEnd.rowIndex &&
      dragStart.dateIndex === dragEnd.dateIndex;

    if (isDragging && dragStart && dragEnd && !isSameCell) {
      setSelectedSlots(previewSelection);
      setBaseSelection(previewSelection);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => setLongPressCell(null), 100);
  }, [isDragging, dragStart, dragEnd, previewSelection, setSelectedSlots]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart && dragEnd) {
        setSelectedSlots(previewSelection);
        setBaseSelection(previewSelection);
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd, previewSelection, setSelectedSlots]);

  return {
    isDragging,
    dragStart,
    dragEnd,
    hoveredCell,
    longPressCell,
    previewSelection,
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
