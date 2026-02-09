"use client";

import { useTranslations } from "next-intl";
import { TimeGranularity } from "../types";

interface GranularitySelectorProps {
  granularity: TimeGranularity;
  onChange: (granularity: TimeGranularity) => void;
  variant?: "default" | "toolbar";
}

const GRANULARITY_OPTIONS: { value: TimeGranularity; labelKey: string }[] = [
  { value: 15, labelKey: "view15min" },
  { value: 30, labelKey: "view30min" },
  { value: 60, labelKey: "view1hr" },
];

export function GranularitySelector({
  granularity,
  onChange,
  variant = "default",
}: GranularitySelectorProps) {
  const tJoined = useTranslations("joined");

  const containerClass =
    variant === "toolbar"
      ? "flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
      : "flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5";

  const buttonClass = (isActive: boolean) =>
    variant === "toolbar"
      ? `h-8 px-3 text-xs font-medium rounded-md transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            : "text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900/70"
        }`
      : `px-2 py-1 text-xs font-medium rounded-md transition-all ${
          isActive
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        }`;

  return (
    <div className={containerClass}>
      {GRANULARITY_OPTIONS.map(({ value, labelKey }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={buttonClass(granularity === value)}
        >
          {tJoined(`mobileTools.${labelKey}`)}
        </button>
      ))}
    </div>
  );
}
