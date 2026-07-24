"use client";

import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";
import { cn } from "@/lib/utils";

interface VotingDeadlineFieldsProps {
  /** 由開關控制的展開狀態 */
  enabled: boolean;
  /** 投票截止日期 */
  date: Date | null;
  /** 投票截止時間 (HH:MM 格式)，未選擇時為 null */
  time: string | null;
  dateLabel: string;
  timeLabel: string;
  datePlaceholder: string;
  timePlaceholder: string;
  /** 活動已確認時段或已開始後鎖定整組欄位 */
  disabled?: boolean;
  /** 日期變更回調 */
  onDateChange: (date: Date | null) => void;
  /** 時間變更回調 */
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
