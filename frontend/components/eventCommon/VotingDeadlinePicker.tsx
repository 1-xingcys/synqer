"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface VotingDeadlinePickerProps {
  /** 投票截止日期 */
  deadlineDate: Date | null;
  /** 投票截止時間 (HH:MM 格式) */
  deadlineTime: string;
  /** 最晚可選的日期（通常是活動最早的時段日期） */
  maxDate?: Date | null;
  /** 最晚可選的時間（當日期等於 maxDate 時使用） */
  maxTime?: string;
  /** 是否有錯誤 */
  hasError?: boolean;
  /** 自訂錯誤訊息 */
  errorMessage?: string;
  /** 日期變更回調 */
  onDateChange: (date: Date | null) => void;
  /** 時間變更回調 */
  onTimeChange: (time: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 共用的投票截止時間選擇器元件
 * 可用於建立活動和編輯活動設定
 */
export function VotingDeadlinePicker({
  deadlineDate,
  deadlineTime,
  maxDate,
  maxTime,
  hasError = false,
  errorMessage,
  onDateChange,
  onTimeChange,
  disabled = false,
}: VotingDeadlinePickerProps) {
  const t = useTranslations();

  // 計算是否超過最大時間限制
  const isOverMaxTime = useMemo(() => {
    if (!deadlineDate || !maxDate || !maxTime) return false;

    // 只有當日期相同時才檢查時間
    const isSameDate =
      deadlineDate.getFullYear() === maxDate.getFullYear() &&
      deadlineDate.getMonth() === maxDate.getMonth() &&
      deadlineDate.getDate() === maxDate.getDate();

    if (!isSameDate) return false;

    // 比較時間
    const [deadlineHour, deadlineMin] = deadlineTime.split(":").map(Number);
    const [maxHour, maxMin] = maxTime.split(":").map(Number);

    const deadlineMinutes = deadlineHour * 60 + deadlineMin;
    const maxMinutes = maxHour * 60 + maxMin;

    return deadlineMinutes > maxMinutes;
  }, [deadlineDate, deadlineTime, maxDate, maxTime]);

  const showError = hasError || isOverMaxTime;

  return (
    <div className={`space-y-4 ${disabled ? "pointer-events-none" : ""}`}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("createEvent.votingDeadline.date")}
          </Label>
          <DatePicker
            value={deadlineDate}
            onChange={onDateChange}
            placeholder={t("createEvent.configuration.selectDate")}
            maxDate={maxDate || undefined}
            disabled={disabled}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("createEvent.votingDeadline.time")}
          </Label>
          <TimePicker
            value={deadlineTime}
            onChange={onTimeChange}
            type="start"
            hasError={showError}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Error message */}
      {showError && !disabled && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {errorMessage || t("createEvent.votingDeadline.error")}
          </p>
        </div>
      )}
    </div>
  );
}
