"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { VotingGridProps, Vote, VoteMode } from "./types";
import { useVotingSelection, useCalendarIntegration } from "./hooks";
import { groupVotesBySlot, formatTime } from "./utils";
import {
  VotingHeader,
  VoteModeToggle,
  SelectionInfoBar,
  GridLegend,
  DateHeader,
  TimeSlotCell,
  GoogleCalendarPanel,
} from "./ui";

export type { VotingGridProps, VoteMode };

export default function VotingGrid({
  slots,
  votes,
  onSave,
  initialSelectedIds = [],
  eventId,
}: VotingGridProps) {
  const tJoined = useTranslations("joined");
  const t = useTranslations("event");
  const [saving, setSaving] = useState(false);
  const [hasSubmittedVote, setHasSubmittedVote] = useState(
    initialSelectedIds.length > 0,
  );
  const gridRef = useRef<HTMLDivElement>(null);

  // Use voting selection hook
  const {
    selectedSlots,
    isDragging,
    hoveredSlot,
    longPressSlot,
    voteMode,
    displaySelection,
    slotsByDate,
    dates,
    timeSlots,
    setHoveredSlot,
    setVoteMode,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    selectEntireDay,
    clearSelection,
    selectAll,
    isSlotInRectangle,
    getRectangleBounds,
    isDayFullySelected,
    applyConflicts,
  } = useVotingSelection({ slots, initialSelectedIds });

  // Use calendar integration hook
  const {
    calendarStatus,
    calendarLoading,
    calendarEvents,
    conflictingSlotIds,
    loadingCalendar,
    showCalendarPanel,
    showCalendarOnGrid,
    calendarEventsForSlot,
    setShowCalendarPanel,
    setShowCalendarOnGrid,
    connectCalendar,
    loadCalendarConflicts,
    isEventStartInSlot,
    getEventSpanFromSlot,
  } = useCalendarIntegration({ eventId, slots, slotsByDate });

  // Group votes by slot
  const votesBySlot = useMemo(() => groupVotesBySlot(votes), [votes]);

  // Get voters for a slot
  const getVotersForSlot = useCallback(
    (slotId: string): string[] => {
      return (votesBySlot[slotId] || []).map((v: Vote) => v.userDisplayName);
    },
    [votesBySlot],
  );

  // Get rectangle bounds
  const rectangleBounds = getRectangleBounds();

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selectedSlots), voteMode);
      setHasSubmittedVote(true);
    } catch (error) {
      console.error("Save error:", error);
      alert(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  // Mark conflicts as unavailable
  const markConflictsAsUnavailable = useCallback(() => {
    applyConflicts(conflictingSlotIds);
  }, [applyConflicts, conflictingSlotIds]);

  return (
    <div className="space-y-4">
      {/* Header with voting status and save button */}
      <VotingHeader
        voteMode={voteMode}
        hasSubmittedVote={hasSubmittedVote}
        saving={saving}
        onSave={() => void handleSave()}
      />

      {/* Vote Mode Toggle */}
      <VoteModeToggle voteMode={voteMode} onModeChange={setVoteMode} />

      {/* Google Calendar Integration */}
      <GoogleCalendarPanel
        eventId={eventId}
        calendarStatus={calendarStatus}
        calendarLoading={calendarLoading}
        calendarEvents={calendarEvents}
        conflictingSlotIds={conflictingSlotIds}
        loadingCalendar={loadingCalendar}
        showCalendarPanel={showCalendarPanel}
        showCalendarOnGrid={showCalendarOnGrid}
        setShowCalendarPanel={setShowCalendarPanel}
        setShowCalendarOnGrid={setShowCalendarOnGrid}
        connectCalendar={connectCalendar}
        loadCalendarConflicts={loadCalendarConflicts}
        markConflictsAsUnavailable={markConflictsAsUnavailable}
      />

      {/* Instructions */}
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        {voteMode === "available"
          ? tJoined("dragToSelectAvailable")
          : tJoined("dragToSelectUnavailable")}
      </p>

      {/* Selection info bar */}
      <SelectionInfoBar
        selectedCount={displaySelection.size}
        onClear={clearSelection}
        onSelectAll={selectAll}
      />

      {/* Grid */}
      <div
        ref={gridRef}
        className="overflow-x-auto select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        <div className="min-w-fit relative">
          {/* Date headers */}
          <DateHeader
            dates={dates}
            isDayFullySelected={isDayFullySelected}
            onSelectDay={selectEntireDay}
          />

          {/* Time slots grid */}
          <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden relative">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeIndex} className="flex">
                {/* Time label */}
                <div className="w-20 shrink-0 px-2 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 border-r border-gray-200 dark:border-zinc-700 flex items-center">
                  {formatTime(timeSlot.startMinute)}
                </div>
                {/* Slot cells */}
                {dates.map((dateKey, dateIndex) => {
                  const slot = slotsByDate[dateKey][timeIndex];
                  const isSelected = displaySelection.has(slot.id);
                  const voters = getVotersForSlot(slot.id);
                  const isHovered = hoveredSlot === slot.id;
                  const isLongPressed = longPressSlot === slot.id;
                  const inRectangle = isSlotInRectangle(slot.id);
                  const slotCalendarEvents =
                    calendarEventsForSlot.get(slot.id) || [];

                  return (
                    <TimeSlotCell
                      key={slot.id}
                      slot={slot}
                      dateIndex={dateIndex}
                      timeIndex={timeIndex}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      isLongPressed={isLongPressed}
                      isDragging={isDragging}
                      inRectangle={inRectangle}
                      rectangleBounds={rectangleBounds}
                      voteMode={voteMode}
                      voters={voters}
                      slotCalendarEvents={slotCalendarEvents}
                      showCalendarOnGrid={showCalendarOnGrid}
                      isEventStartInSlot={isEventStartInSlot}
                      getEventSpanFromSlot={getEventSpanFromSlot}
                      onMouseDown={handleMouseDown}
                      onMouseEnter={handleMouseEnter}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <GridLegend
        voteMode={voteMode}
        showCalendarOnGrid={showCalendarOnGrid}
        calendarEvents={calendarEvents}
      />
    </div>
  );
}
