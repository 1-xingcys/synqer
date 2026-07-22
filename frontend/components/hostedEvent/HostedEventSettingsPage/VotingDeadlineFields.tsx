"use client";

import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/eventCommon/DatePicker";
import { TimePicker } from "@/components/eventCommon/TimePicker";

const CHECKBOX_ID = "hosted-enable-voting-deadline";
const LABEL_CLASS_NAME = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

interface VotingDeadlineFieldsProps {
  enabled: boolean;
  /** 投票截止日期 */
  date: Date | null;
  /** 投票截止時間 (HH:MM 格式)，未選擇時為 null */
  time: string | null;
  enableLabel: string;
  dateLabel: string;
  timeLabel: string;
  datePlaceholder: string;
  /** 活動已確認時段或已開始後鎖定整組欄位 */
  disabled?: boolean;
  /** 由上層驗證邏輯提供的錯誤訊息 */
  errorMessage?: string | null;
  onEnabledChange: (enabled: boolean) => void;
  /** 日期變更回調 */
  onDateChange: (date: Date | null) => void;
  /** 時間變更回調 */
  onTimeChange: (time: string) => void;
}

/**
 * 主辦設定頁專用的投票截止時間欄位。
 * 只負責顯示 checkbox、日期/時間欄位與錯誤訊息，
 * 是否可編輯與驗證規則由 useEventSettings 決定。
 *
 * 建立活動頁有自己的一份（CreateEventForm/VotingDeadlineFields），
 * 兩邊的樣式可以各自調整，不互相牽動。
 */
export function VotingDeadlineFields({
  enabled,
  date,
  time,
  enableLabel,
  dateLabel,
  timeLabel,
  datePlaceholder,
  disabled = false,
  errorMessage = null,
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
            id={CHECKBOX_ID}
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(checked === true)}
            disabled={disabled}
          />
          <Label
            htmlFor={CHECKBOX_ID}
            className={`${LABEL_CLASS_NAME} cursor-pointer`}
          >
            {enableLabel}
          </Label>
        </div>
      </div>

      {enabled ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={LABEL_CLASS_NAME}>{dateLabel}</Label>
              <DatePicker
                value={date}
                onChange={onDateChange}
                placeholder={datePlaceholder}
                disabled={disabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL_CLASS_NAME}>{timeLabel}</Label>
              <TimePicker
                value={time}
                onChange={onTimeChange}
                type="start"
                hasError={showError}
                disabled={disabled}
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
