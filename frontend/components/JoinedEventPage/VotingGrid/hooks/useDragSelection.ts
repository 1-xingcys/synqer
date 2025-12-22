"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { GridPosition } from "../types";

interface UseDragSelectionProps {
  selectedSlots: Set<string>;
  setSelectedSlots: React.Dispatch<React.SetStateAction<Set<string>>>;
  getSlotPosition: (slotId: string) => GridPosition | null;
  getSlotsInRectangle: (start: GridPosition, end: GridPosition) => Set<string>;
}

interface UseDragSelectionReturn {
  // State
  isDragging: boolean;
  dragStart: GridPosition | null;
  dragEnd: GridPosition | null;
  baseSelection: Set<string>;
  hoveredSlot: string | null;
  longPressSlot: string | null;

  // Computed
  previewSelection: Set<string>;
  displaySelection: Set<string>;

  // Actions
  setHoveredSlot: React.Dispatch<React.SetStateAction<string | null>>;
  handleMouseDown: (slotId: string, e: React.MouseEvent) => void;
  handleMouseEnter: (slotId: string) => void;
  handleMouseUp: () => void;
  handleTouchStart: (slotId: string, e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleClick: (slotId: string) => void;
  isSlotInRectangle: (slotId: string) => boolean;
  getRectangleBounds: () => {
    minDate: number;
    maxDate: number;
    minTime: number;
    maxTime: number;
  } | null;
  resetBaseSelection: () => void;
}

export function useDragSelection({
  selectedSlots,
  setSelectedSlots,
  getSlotPosition,
  getSlotsInRectangle,
}: UseDragSelectionProps): UseDragSelectionReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<GridPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<GridPosition | null>(null);
  const [baseSelection, setBaseSelection] = useState<Set<string>>(
    new Set(selectedSlots),
  );
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [longPressSlot, setLongPressSlot] = useState<string | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Calculate preview selection (with negation)
  const previewSelection = useMemo(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      return selectedSlots;
    }

    const rectangleSlots = getSlotsInRectangle(dragStart, dragEnd);
    const newSelection = new Set(baseSelection);

    rectangleSlots.forEach((slotId) => {
      if (baseSelection.has(slotId)) {
        newSelection.delete(slotId);
      } else {
        newSelection.add(slotId);
      }
    });

    return newSelection;
  }, [
    isDragging,
    dragStart,
    dragEnd,
    baseSelection,
    getSlotsInRectangle,
    selectedSlots,
  ]);

  const displaySelection = isDragging ? previewSelection : selectedSlots;

  // Check if slot is in current rectangle
  const isSlotInRectangle = useCallback(
    (slotId: string): boolean => {
      if (!isDragging || !dragStart || !dragEnd) return false;
      const rectangleSlots = getSlotsInRectangle(dragStart, dragEnd);
      return rectangleSlots.has(slotId);
    },
    [isDragging, dragStart, dragEnd, getSlotsInRectangle],
  );

  // Get rectangle bounds for visual overlay
  const getRectangleBounds = useCallback(() => {
    if (!dragStart || !dragEnd) return null;
    return {
      minDate: Math.min(dragStart.dateIndex, dragEnd.dateIndex),
      maxDate: Math.max(dragStart.dateIndex, dragEnd.dateIndex),
      minTime: Math.min(dragStart.timeIndex, dragEnd.timeIndex),
      maxTime: Math.max(dragStart.timeIndex, dragEnd.timeIndex),
    };
  }, [dragStart, dragEnd]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (slotId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const position = getSlotPosition(slotId);
      if (position) {
        setIsDragging(true);
        setDragStart(position);
        setDragEnd(position);
        setBaseSelection(new Set(selectedSlots));
      }
    },
    [getSlotPosition, selectedSlots],
  );

  const handleMouseEnter = useCallback(
    (slotId: string) => {
      setHoveredSlot(slotId);
      if (isDragging) {
        const position = getSlotPosition(slotId);
        if (position) {
          setDragEnd(position);
        }
      }
    },
    [isDragging, getSlotPosition],
  );

  const handleMouseUp = useCallback(() => {
    // Only apply selection if we dragged to a different cell
    // Single click on same cell is handled by onClick
    const isSameCell = dragStart && dragEnd && 
      dragStart.dateIndex === dragEnd.dateIndex && 
      dragStart.timeIndex === dragEnd.timeIndex;

    if (isDragging && dragStart && dragEnd && !isSameCell) {
      setSelectedSlots(previewSelection);
      setBaseSelection(previewSelection);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, previewSelection, setSelectedSlots]);

  // Simple click handler for single slot toggle
  const handleClick = useCallback(
    (slotId: string) => {
      setSelectedSlots((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(slotId)) {
          newSet.delete(slotId);
        } else {
          newSet.add(slotId);
        }
        return newSet;
      });
    },
    [setSelectedSlots],
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (slotId: string, e: React.TouchEvent) => {
      e.preventDefault();
      
      longPressTimer.current = setTimeout(() => {
        setLongPressSlot(slotId);
      }, 500);

      const position = getSlotPosition(slotId);
      if (position) {
        setIsDragging(true);
        setDragStart(position);
        setDragEnd(position);
        setBaseSelection(new Set(selectedSlots));
      }
    },
    [getSlotPosition, selectedSlots],
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
      const slotId = element?.getAttribute("data-slot-id");

      if (slotId) {
        const position = getSlotPosition(slotId);
        if (position) {
          setDragEnd(position);
        }
      }
    },
    [isDragging, getSlotPosition],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Only apply selection if we dragged to a different cell
    // Single tap on same cell is handled by onClick
    const isSameCell = dragStart && dragEnd && 
      dragStart.dateIndex === dragEnd.dateIndex && 
      dragStart.timeIndex === dragEnd.timeIndex;

    if (isDragging && dragStart && dragEnd && !isSameCell) {
      setSelectedSlots(previewSelection);
      setBaseSelection(previewSelection);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setTimeout(() => setLongPressSlot(null), 100);
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

  // Reset base selection (used when vote mode changes)
  const resetBaseSelection = useCallback(() => {
    setBaseSelection(new Set());
  }, []);

  return {
    // State
    isDragging,
    dragStart,
    dragEnd,
    baseSelection,
    hoveredSlot,
    longPressSlot,

    // Computed
    previewSelection,
    displaySelection,

    // Actions
    setHoveredSlot,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick,
    isSlotInRectangle,
    getRectangleBounds,
    resetBaseSelection,
  };
}
