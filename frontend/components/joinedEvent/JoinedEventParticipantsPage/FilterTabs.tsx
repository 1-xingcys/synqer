"use client";

import { cn } from "@/lib/utils";
import { FilterType } from "./types";

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    voted: number;
    notVoted: number;
  };
  labels: {
    all: string;
    voted: string;
    notVoted: string;
  };
}

export function FilterTabs({
  activeFilter,
  onFilterChange,
  counts,
  labels,
}: FilterTabsProps) {
  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: labels.all, count: counts.all },
    { key: "voted", label: labels.voted, count: counts.voted },
    { key: "notVoted", label: labels.notVoted, count: counts.notVoted },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            activeFilter === tab.key
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700",
          )}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
