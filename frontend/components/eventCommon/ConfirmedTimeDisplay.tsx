"use client";

import { ConfirmedSelection } from "@/types/event";
import { useLocale } from "next-intl";
import { formatConfirmedSelection } from "./confirmed-time-formatters";

interface ConfirmedTimeDisplayProps {
  selections: ConfirmedSelection[];
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
  className = "",
}: ConfirmedTimeDisplayProps) {
  const locale = useLocale();
  const displayCount = selections.length;

  if (displayCount === 0) {
    return null;
  }

  const displayItems = selections.map(
    (selection, index) =>
      [index, formatConfirmedSelection(selection, locale) ?? ""] as const,
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {displayItems.map(([index, label]) => (
        <div key={index}>{label}</div>
      ))}
    </div>
  );
}
