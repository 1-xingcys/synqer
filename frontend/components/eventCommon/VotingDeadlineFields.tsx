"use client";

import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";

interface VotingDeadlineFieldsProps {
  checkboxId: string;
  enabled: boolean;
  /** 投票截止日期 */
  date: Date | null;
  /** 投票截止時間 (HH:MM 格式)，未選擇時為 null */
  time: string | null;
  enableLabel: string;
  dateLabel: string;
  timeLabel: string;
  datePlaceholder: string;
  timePlaceholder?: string;
  /** 可選的最早日期 */
  minDate?: Date;
  /** 最晚可選的日期（通常是活動開始日或最早時段日期） */
  maxDate?: Date;
  /** 是否禁用 */
  disabled?: boolean;
  /** 由上層驗證邏輯提供的錯誤訊息 */
  errorMessage?: string | null;
  enableLabelClassName?: string;
  fieldLabelClassName?: string;
  onEnabledChange: (enabled: boolean) => void;
  /** 日期變更回調 */
  onDateChange: (date: Date | null) => void;
  /** 時間變更回調 */
  onTimeChange: (time: string) => void;
}

/**
 * 共用的投票截止時間欄位元件。
 * 只負責顯示 checkbox、日期/時間欄位與錯誤訊息，
 * 實際的驗證規則與頁面行為由上層 hook/component 決定。
 */
export function VotingDeadlineFields({
  checkboxId,
  enabled,
  date,
  time,
  enableLabel,
  dateLabel,
  timeLabel,
  datePlaceholder,
  timePlaceholder,
  minDate,
  maxDate,
  disabled = false,
  errorMessage = null,
  enableLabelClassName = "text-sm font-medium cursor-pointer",
  fieldLabelClassName,
  onEnabledChange,
  onDateChange,
  onTimeChange,
}: VotingDeadlineFieldsProps) {
  const showError = enabled && !disabled && Boolean(errorMessage);

  return (
    <div className={`space-y-4 ${disabled ? "pointer-events-none" : ""}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkboxId}
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(checked === true)}
            disabled={disabled}
          />
          <Label htmlFor={checkboxId} className={enableLabelClassName}>
            {enableLabel}
          </Label>
        </div>
      </div>

      {enabled ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={fieldLabelClassName}>{dateLabel}</Label>
              <DatePicker
                value={date}
                onChange={onDateChange}
                placeholder={datePlaceholder}
                minDate={minDate}
                maxDate={maxDate}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={fieldLabelClassName}>{timeLabel}</Label>
              <TimePicker
                value={time}
                onChange={onTimeChange}
                type="start"
                hasError={showError}
                disabled={disabled}
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
        </>
      ) : null}
    </div>
  );
}
