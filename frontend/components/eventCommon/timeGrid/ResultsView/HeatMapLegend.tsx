"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface HeatMapLegendProps {
  maxVotes: number;
}

// Utility to get heatmap color based on vote count
export function getHeatmapColor(
  voteCount: number,
  maxVotes: number,
  forLegend: boolean = false,
): { bg: string; text: string } {
  if (voteCount === 0) {
    return {
      bg: "bg-gray-50 dark:bg-zinc-800/50",
      text: "text-gray-400 dark:text-zinc-500",
    };
  }

  // Calculate intensity from 1-5 based on ratio
  const ratio = voteCount / maxVotes;
  let intensity: number;

  if (ratio <= 0.2) intensity = 1;
  else if (ratio <= 0.4) intensity = 2;
  else if (ratio <= 0.6) intensity = 3;
  else if (ratio <= 0.8) intensity = 4;
  else intensity = 5;

  // For legend, we want exact intensity levels
  if (forLegend) {
    intensity = voteCount;
  }

  const colorMap: Record<number, { bg: string; text: string }> = {
    1: {
      bg: "bg-emerald-100 dark:bg-emerald-950/60",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    2: {
      bg: "bg-emerald-200 dark:bg-emerald-900/70",
      text: "text-emerald-800 dark:text-emerald-200",
    },
    3: {
      bg: "bg-emerald-300 dark:bg-emerald-800/80",
      text: "text-emerald-900 dark:text-emerald-100",
    },
    4: {
      bg: "bg-emerald-400 dark:bg-emerald-700",
      text: "text-white",
    },
    5: {
      bg: "bg-emerald-500 dark:bg-emerald-600",
      text: "text-white",
    },
  };

  return colorMap[intensity] || colorMap[1];
}

// Get dynamic heatmap classes based on actual values
export function getHeatmapClasses(
  voteCount: number,
  maxVotes: number,
): { bg: string; text: string } {
  if (maxVotes === 0 || voteCount === 0) {
    return {
      bg: "bg-gray-50 dark:bg-zinc-800/50",
      text: "text-gray-400 dark:text-zinc-500",
    };
  }

  const ratio = voteCount / maxVotes;

  if (ratio <= 0.2) {
    return {
      bg: "bg-emerald-100 dark:bg-emerald-950/60",
      text: "text-emerald-700 dark:text-emerald-300",
    };
  } else if (ratio <= 0.4) {
    return {
      bg: "bg-emerald-200 dark:bg-emerald-900/70",
      text: "text-emerald-800 dark:text-emerald-200",
    };
  } else if (ratio <= 0.6) {
    return {
      bg: "bg-emerald-300 dark:bg-emerald-800/80",
      text: "text-emerald-900 dark:text-emerald-100",
    };
  } else if (ratio <= 0.8) {
    return {
      bg: "bg-emerald-400 dark:bg-emerald-700",
      text: "text-white",
    };
  } else {
    return {
      bg: "bg-emerald-500 dark:bg-emerald-600",
      text: "text-white",
    };
  }
}

export function HeatMapLegend({ maxVotes }: HeatMapLegendProps) {
  const t = useTranslations("joined");

  // Generate legend steps dynamically based on max votes
  const legendSteps = useMemo(() => {
    if (maxVotes === 0) return [{ value: 0, label: "0" }];

    const steps: { value: number; label: string }[] = [];

    // Always start with 0
    steps.push({ value: 0, label: "0" });

    // Add intermediate steps - aim for 4-5 total steps
    if (maxVotes === 1) {
      steps.push({ value: 1, label: "1" });
    } else if (maxVotes === 2) {
      steps.push({ value: 1, label: "1" });
      steps.push({ value: 2, label: "2" });
    } else if (maxVotes <= 5) {
      for (let i = 1; i <= maxVotes; i++) {
        steps.push({ value: i, label: i.toString() });
      }
    } else {
      // For larger numbers, show strategic breakpoints
      const breakpoints = [
        Math.ceil(maxVotes * 0.25),
        Math.ceil(maxVotes * 0.5),
        Math.ceil(maxVotes * 0.75),
        maxVotes,
      ];

      const uniqueBreakpoints = [...new Set(breakpoints)].filter((b) => b > 0);
      uniqueBreakpoints.forEach((bp) => {
        steps.push({ value: bp, label: bp.toString() });
      });
    }

    return steps;
  }, [maxVotes]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
      {/* Label */}
      <span className="text-gray-500 dark:text-zinc-400 font-medium shrink-0">
        {t("results.legendLabel")}
      </span>

      {/* Color Scale */}
      <div className="flex items-center gap-0">
        {legendSteps.map((step, index) => {
          const colors = getHeatmapClasses(step.value, maxVotes);
          const isFirst = index === 0;
          const isLast = index === legendSteps.length - 1;

          return (
            <div key={step.value} className="flex items-center">
              {/* Color box */}
              <div
                className={`
                  w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] sm:text-xs font-medium
                  ${colors.bg} ${colors.text}
                  ${isFirst ? "rounded-l" : ""}
                  ${isLast ? "rounded-r" : ""}
                  border-y border-gray-200 dark:border-zinc-700
                  ${isFirst ? "border-l" : ""}
                  ${isLast ? "border-r" : ""}
                `}
              >
                {step.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
