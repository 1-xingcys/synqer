"use client";

import type { ConfirmedSelection } from "@/types/event";
import { useLocale } from "next-intl";
import { formatConfirmedSelection } from "./confirmed-time-formatters";

interface ConfirmedTimeDisplayProps {
  selections: ConfirmedSelection[];
  /** 自訂 className */
  className?: string;
}

// Render all confirmed time labels for the current locale.
export function ConfirmedTimeDisplay({
  selections,
  className = "",
}: ConfirmedTimeDisplayProps) {
  const locale = useLocale();

  if (selections.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {selections.map((selection, index) => (
        <div key={index}>
          {formatConfirmedSelection(selection, locale) ?? ""}
        </div>
      ))}
    </div>
  );
}
