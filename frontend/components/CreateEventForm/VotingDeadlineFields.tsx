"use client";

import { AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";
import { cn } from "@/lib/utils";

const SWITCH_ID = "enable-voting-deadline";

interface VotingDeadlineFieldsProps {
  enabled: boolean;
  /** Voting deadline date */
  date: Date | null;
  /** Voting deadline time (HH:MM format), null when not picked */
  time: string | null;
  enableLabel: string;
  dateLabel: string;
  timeLabel: string;
  datePlaceholder: string;
  timePlaceholder: string;
  errorMessage?: string | null;
  onEnabledChange: (enabled: boolean) => void;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string) => void;
}

export function VotingDeadlineFields({
  enabled,
  date,
  time,
  enableLabel,
  dateLabel,
  timeLabel,
  datePlaceholder,
  timePlaceholder,
  errorMessage = null,
  onEnabledChange,
  onDateChange,
  onTimeChange,
}: VotingDeadlineFieldsProps) {
  const showError = enabled && Boolean(errorMessage);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={SWITCH_ID} className="text-sm cursor-pointer">
          {enableLabel}
        </Label>
        <Switch
          id={SWITCH_ID}
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {/*
        The fields stay mounted so the height can animate in both directions:
        the grid row goes 0fr -> 1fr while the inner wrapper clips the overflow.
        `inert` keeps the collapsed fields out of the tab order and the
        accessibility tree, since they are only visually hidden.
      */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out motion-reduce:transition-none",
          enabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        inert={!enabled}
      >
        <div className="overflow-hidden">
          {/* Padding lives inside the clipped area so it collapses too. */}
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{dateLabel}</Label>
                <DatePicker
                  value={date}
                  onChange={onDateChange}
                  placeholder={datePlaceholder}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{timeLabel}</Label>
                <TimePicker
                  value={time}
                  onChange={onTimeChange}
                  type="start"
                  hasError={showError}
                  placeholder={timePlaceholder}
                />
              </div>
            </div>

            {showError ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
