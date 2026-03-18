"use client";

import { ConfirmedTimeRange } from "@/types/event";
import { useLocale, useTranslations } from "next-intl";
import { TimeSlot } from "@/components/eventCommon/timeGrid/types";
import { formatConfirmedTimeRange } from "./confirmed-time-formatters";

interface ConfirmedTimeDisplayProps {
  timeRanges: ConfirmedTimeRange[];
  slots?: TimeSlot[];
  /** 預覽模式：只顯示第一個時間範圍和剩餘數量 */
  preview?: boolean;
  /** 自訂 className */
  className?: string;
}

/**
 * 確認時間顯示元件
 * - 完整模式：顯示所有時間範圍
 * - 預覽模式：只顯示第一個時間範圍和剩餘數量
 */
export function ConfirmedTimeDisplay({
  timeRanges,
  slots,
  preview = false,
  className = "",
}: ConfirmedTimeDisplayProps) {
  const t = useTranslations("event");
  const locale = useLocale();
  const slotsById = new Map((slots ?? []).map((slot) => [slot.id, slot]));

  if (!timeRanges || timeRanges.length === 0) {
    return null;
  }

  if (preview) {
    // 預覽模式：顯示第一個時間範圍
    const firstRange = timeRanges[0];
    const firstRangeStr = formatConfirmedTimeRange(
      firstRange,
      locale,
      slotsById,
    );

    if (timeRanges.length === 1) {
      return <span className={className}>{firstRangeStr}</span>;
    }

    return (
      <span className={className}>
        {firstRangeStr}{" "}
        <span className="text-muted-foreground">
          {t("confirmedTime.moreRanges", { count: timeRanges.length - 1 })}
        </span>
      </span>
    );
  }

  // 完整模式：顯示所有時間範圍
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {timeRanges.map((range, index) => (
        <div key={index} className="text-sm">
          {formatConfirmedTimeRange(range, locale, slotsById)}
        </div>
      ))}
    </div>
  );
}
