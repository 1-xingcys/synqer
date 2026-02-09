"use client";

import { useTranslations } from "next-intl";
import { TimeGranularity } from "../types";

interface GranularitySelectorProps {
  granularity: TimeGranularity;
  onChange: (granularity: TimeGranularity) => void;
}

const GRANULARITY_OPTIONS: { value: TimeGranularity; labelKey: string }[] = [
  { value: 15, labelKey: "view15min" },
  { value: 30, labelKey: "view30min" },
  { value: 60, labelKey: "view1hr" },
];

export function GranularitySelector({
  granularity,
  onChange,
}: GranularitySelectorProps) {
  const tJoined = useTranslations("joined");

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
      {GRANULARITY_OPTIONS.map(({ value, labelKey }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
            granularity === value
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          {tJoined(`mobileTools.${labelKey}`)}
        </button>
      ))}
    </div>
  );
}
