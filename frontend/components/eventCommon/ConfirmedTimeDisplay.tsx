"use client";

import { ConfirmedTimeRange } from "@/types/event";
import { useLocale, useTranslations } from "next-intl";
import { TimeSlot } from "@/components/eventCommon/timeGrid/types";
import { formatWeekdayLabel } from "@/lib/weekdays";

interface ConfirmedTimeDisplayProps {
  timeRanges: ConfirmedTimeRange[];
  slots?: TimeSlot[];
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

  // 使用 short month 格式 (Dec 25)
  // 後端使用 UTC 時間儲存，前端顯示時也要用 UTC
  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
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

function formatRecurringTimeRange(
  range: ConfirmedTimeRange,
  locale: string,
  slotsById: Map<string, TimeSlot>,
): string | null {
  const slots = range.slotIds
    .map((slotId) => slotsById.get(slotId))
    .filter((slot): slot is TimeSlot => Boolean(slot));

  if (
    slots.length === 0 ||
    slots[0].axisType !== "WEEKDAY" ||
    !slots[0].axisWeekday
  ) {
    return null;
  }

  const sortedSlots = [...slots].sort((left, right) => {
    if (left.startMinute !== right.startMinute) {
      return left.startMinute - right.startMinute;
    }
    return left.endMinute - right.endMinute;
  });
  const firstSlot = sortedSlots[0];
  const weekday = firstSlot.axisWeekday;
  if (!weekday) {
    return null;
  }

  const weekdayLabel = formatWeekdayLabel(weekday, locale);
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const startTime = new Date(range.startTime);
  const endTime = new Date(range.endTime);

  return `${weekdayLabel} ${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`;
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
    const firstRangeStr =
      formatRecurringTimeRange(firstRange, locale, slotsById) ??
      formatTimeRange(firstRange, locale);

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
          {formatRecurringTimeRange(range, locale, slotsById) ??
            formatTimeRange(range, locale)}
        </div>
      ))}
    </div>
  );
}
