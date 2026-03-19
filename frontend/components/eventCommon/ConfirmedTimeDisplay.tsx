"use client";

import { ConfirmedSelection } from "@/types/event";
import { useLocale, useTranslations } from "next-intl";
import { formatConfirmedSelection } from "./confirmed-time-formatters";

interface ConfirmedTimeDisplayProps {
  selections: ConfirmedSelection[];
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
  selections,
  preview = false,
  className = "",
}: ConfirmedTimeDisplayProps) {
  const t = useTranslations("event");
  const locale = useLocale();
  const displayCount = selections.length;

  if (displayCount === 0) {
    return null;
  }

  if (preview) {
    const firstRangeStr = formatConfirmedSelection(selections[0], locale) ?? "";

    if (displayCount === 1) {
      return <span className={className}>{firstRangeStr}</span>;
    }

    return (
      <span className={className}>
        {firstRangeStr}{" "}
        <span className="text-muted-foreground">
          {t("confirmedTime.moreRanges", { count: displayCount - 1 })}
        </span>
      </span>
    );
  }

  const displayItems = selections.map(
    (selection, index) =>
      [index, formatConfirmedSelection(selection, locale) ?? ""] as const,
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {displayItems.map(([index, label]) => (
        <div key={index} className="text-sm">
          {label}
        </div>
      ))}
    </div>
  );
}
