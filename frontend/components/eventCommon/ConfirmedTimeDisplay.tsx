"use client";

import { ConfirmedTimeRange } from "@/types/event";
import { useLocale, useTranslations } from "next-intl";

interface ConfirmedTimeDisplayProps {
  timeRanges: ConfirmedTimeRange[];
  /** 預覽模式：只顯示第一個時間範圍和剩餘數量 */
  preview?: boolean;
  /** 自訂 className */
  className?: string;
}

/**
 * 格式化單一時間範圍
 */
function formatTimeRange(range: ConfirmedTimeRange, locale: string): string {
  const startDate = new Date(range.startTime);
  const endDate = new Date(range.endTime);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const startDateStr = dateFormatter.format(startDate);
  const startTimeStr = timeFormatter.format(startDate);
  const endTimeStr = timeFormatter.format(endDate);

  // 檢查是否同一天
  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (isSameDay) {
    return `${startDateStr} ${startTimeStr} - ${endTimeStr}`;
  }

  const endDateStr = dateFormatter.format(endDate);
  return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
}

/**
 * 確認時間顯示元件
 * - 完整模式：顯示所有時間範圍
 * - 預覽模式：只顯示第一個時間範圍和剩餘數量
 */
export function ConfirmedTimeDisplay({
  timeRanges,
  preview = false,
  className = "",
}: ConfirmedTimeDisplayProps) {
  const t = useTranslations("event");
  const locale = useLocale();

  if (!timeRanges || timeRanges.length === 0) {
    return null;
  }

  if (preview) {
    // 預覽模式：顯示第一個時間範圍
    const firstRange = timeRanges[0];
    const firstRangeStr = formatTimeRange(firstRange, locale);

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
          {formatTimeRange(range, locale)}
        </div>
      ))}
    </div>
  );
}
