"use client";

import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/DatePicker";
import type { CalendarDay } from "@/lib/time";
import { TimePicker } from "@/components/ui/TimePicker";
import { cn } from "@/lib/ui/utils";

interface VotingDeadlineFieldsProps {
  /** Expanded state driven by the toggle */
  enabled: boolean;
  /** Voting deadline date */
  date: CalendarDay | null;
  /** Voting deadline time (HH:MM format), null when not picked */
  time: string | null;
  dateLabel: string;
  timeLabel: string;
  datePlaceholder: string;
  timePlaceholder: string;
  disabled?: boolean;
  onDateChange: (day: CalendarDay | null) => void;
  onTimeChange: (time: string) => void;
}

export function VotingDeadlineFields({
  enabled,
  date,
  time,
  dateLabel,
  timeLabel,
  datePlaceholder,
  timePlaceholder,
  disabled = false,
  onDateChange,
  onTimeChange,
}: VotingDeadlineFieldsProps) {
  return (
    /*
      The fields stay mounted so the height can animate in both directions:
      the grid row goes 0fr -> 1fr while the inner wrapper clips the overflow.
      `inert` keeps the collapsed fields out of the tab order and the
      accessibility tree, since they are only visually hidden.
    */
    <div
      className={cn(
        "grid transition-all duration-300 ease-in-out motion-reduce:transition-none",
        enabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      inert={!enabled}
    >
      <div className="overflow-hidden">
        {/* Padding lives inside the clipped area so it collapses too. */}
        <hr className="my-2 border-t border-gray-300" />
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-1.5">
            <Label>{dateLabel}</Label>
            <DatePicker
              value={date}
              onChange={onDateChange}
              placeholder={datePlaceholder}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{timeLabel}</Label>
            <TimePicker
              value={time}
              onChange={onTimeChange}
              type="start"
              placeholder={timePlaceholder}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
