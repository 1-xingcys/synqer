"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { MergedTimeRow } from "../../types";

interface CellPosition {
  rowIndex: number;
  dateIndex: number;
}

export interface SelectionRange {
  cells: Array<{ dateKey: string; rowIndex: number; slotIndices: number[] }>;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
}

interface RectBounds {
  minRow: number;
  maxRow: number;
  minDate: number;
  maxDate: number;
}

interface UseResultsRangeSelectionParams {
  gridRef: RefObject<HTMLDivElement | null>;
  mergedTimeRows: MergedTimeRow[];
  paginatedDates: string[];
  onRangeSelect: (range: SelectionRange) => void;
}

interface UseResultsRangeSelectionResult {
  isDragging: boolean;
  rectBounds: RectBounds | null;
  isInDragRectangle: (rowIndex: number, dateIndex: number) => boolean;
  handleCellClick: (
    dateKey: string,
    rowIndex: number,
    slotIndices: number[],
  ) => void;
  handleTouchStart: (
    rowIndex: number,
    dateIndex: number,
    e: ReactTouchEvent,
  ) => void;
  handleTouchMove: (e: ReactTouchEvent) => void;
  handleTouchEnd: () => void;
  handleMouseDown: (
    rowIndex: number,
    dateIndex: number,
    e: ReactMouseEvent,
  ) => void;
  handleMouseMove: (e: ReactMouseEvent) => void;
  handleMouseUp: () => void;
}

export function useResultsRangeSelection({
  gridRef,
  mergedTimeRows,
  paginatedDates,
  onRangeSelect,
}: UseResultsRangeSelectionParams): UseResultsRangeSelectionResult {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<CellPosition | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): CellPosition | null => {
      if (!gridRef.current) return null;

      const gridElement = gridRef.current.querySelector('[data-grid="slots"]');
      if (!gridElement) return null;

      const cells = gridElement.querySelectorAll("[data-cell]");
      for (const cell of cells) {
        const rect = cell.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          const rowIndex = parseInt(cell.getAttribute("data-row") || "0", 10);
          const dateIndex = parseInt(cell.getAttribute("data-date") || "0", 10);
          return { rowIndex, dateIndex };
        }
      }

      return null;
    },
    [gridRef],
  );

  const getRectangleBounds = useCallback((): RectBounds | null => {
    if (!dragStart || !dragEnd) return null;
    return {
      minRow: Math.min(dragStart.rowIndex, dragEnd.rowIndex),
      maxRow: Math.max(dragStart.rowIndex, dragEnd.rowIndex),
      minDate: Math.min(dragStart.dateIndex, dragEnd.dateIndex),
      maxDate: Math.max(dragStart.dateIndex, dragEnd.dateIndex),
    };
  }, [dragStart, dragEnd]);

  const buildRangeFromBounds = useCallback(
    (bounds: RectBounds): SelectionRange | null => {
      const cells: SelectionRange["cells"] = [];
      const dateKeys: string[] = [];

      for (let dateIdx = bounds.minDate; dateIdx <= bounds.maxDate; dateIdx++) {
        const dateKey = paginatedDates[dateIdx];
        if (!dateKey) continue;
        dateKeys.push(dateKey);

        for (let rowIdx = bounds.minRow; rowIdx <= bounds.maxRow; rowIdx++) {
          const row = mergedTimeRows[rowIdx];
          if (!row) continue;
          cells.push({
            dateKey,
            rowIndex: rowIdx,
            slotIndices: row.slotIndices,
          });
        }
      }

      if (cells.length === 0) return null;

      const startRow = mergedTimeRows[bounds.minRow];
      const endRow = mergedTimeRows[bounds.maxRow];
      return {
        cells,
        startDate: dateKeys[0],
        endDate: dateKeys[dateKeys.length - 1],
        startTime: startRow?.startMinute ?? 0,
        endTime: endRow?.endMinute ?? 0,
      };
    },
    [paginatedDates, mergedTimeRows],
  );

  const completeDragSelection = useCallback(() => {
    if (!isDragging) {
      setDragStart(null);
      setDragEnd(null);
      touchStartRef.current = null;
      return;
    }

    const bounds = getRectangleBounds();
    if (bounds) {
      const range = buildRangeFromBounds(bounds);
      if (range) onRangeSelect(range);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    touchStartRef.current = null;
  }, [isDragging, getRectangleBounds, buildRangeFromBounds, onRangeSelect]);

  const handleCellClick = useCallback(
    (dateKey: string, rowIndex: number, slotIndices: number[]) => {
      if (hasDraggedRef.current) {
        hasDraggedRef.current = false;
        return;
      }

      const row = mergedTimeRows[rowIndex];
      if (!row) return;

      onRangeSelect({
        cells: [{ dateKey, rowIndex, slotIndices }],
        startDate: dateKey,
        endDate: dateKey,
        startTime: row.startMinute,
        endTime: row.endMinute,
      });
    },
    [mergedTimeRows, onRangeSelect],
  );

  const handleTouchStart = useCallback(
    (rowIndex: number, dateIndex: number, e: ReactTouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      hasDraggedRef.current = false;
      setDragStart({ rowIndex, dateIndex });
      setDragEnd({ rowIndex, dateIndex });
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (!dragStart || !touchStartRef.current) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      if (dx > 10 || dy > 10) {
        if (!isDragging) {
          setIsDragging(true);
          hasDraggedRef.current = true;
        }

        const cell = getCellFromPoint(touch.clientX, touch.clientY);
        if (cell) setDragEnd(cell);
      }
    },
    [dragStart, isDragging, getCellFromPoint],
  );

  const handleMouseDown = useCallback(
    (rowIndex: number, dateIndex: number, e: ReactMouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      touchStartRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;
      setDragStart({ rowIndex, dateIndex });
      setDragEnd({ rowIndex, dateIndex });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!dragStart || !touchStartRef.current) return;

      const dx = Math.abs(e.clientX - touchStartRef.current.x);
      const dy = Math.abs(e.clientY - touchStartRef.current.y);

      if (dx > 5 || dy > 5) {
        if (!isDragging) {
          setIsDragging(true);
          hasDraggedRef.current = true;
        }

        const cell = getCellFromPoint(e.clientX, e.clientY);
        if (cell) setDragEnd(cell);
      }
    },
    [dragStart, isDragging, getCellFromPoint],
  );

  const rectBounds = useMemo(() => getRectangleBounds(), [getRectangleBounds]);

  const isInDragRectangle = useCallback(
    (rowIndex: number, dateIndex: number): boolean => {
      if (!rectBounds) return false;
      return (
        rowIndex >= rectBounds.minRow &&
        rowIndex <= rectBounds.maxRow &&
        dateIndex >= rectBounds.minDate &&
        dateIndex <= rectBounds.maxDate
      );
    },
    [rectBounds],
  );

  return {
    isDragging,
    rectBounds,
    isInDragRectangle,
    handleCellClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd: completeDragSelection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp: completeDragSelection,
  };
}
