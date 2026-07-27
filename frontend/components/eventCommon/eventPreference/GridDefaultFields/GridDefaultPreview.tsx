"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { VoteMode } from "@/types/event";
import type { TimeGranularity } from "@/types/event";
import { TimeColumn } from "@/components/eventCommon/timeGrid/ui";
import { useResponsiveGrid } from "@/components/eventCommon/timeGrid/hooks";
import { cn } from "@/lib/utils";
import {
  buildPreviewRows,
  PREVIEW_DAYS,
  type PreviewCellFill,
} from "./previewGridModel";

interface GridDefaultPreviewProps {
  granularity: TimeGranularity;
  voteMode: VoteMode;
}

/** Same tones as a committed vote in the real grid. */
const FILL_CLASSES: Record<VoteMode, Record<PreviewCellFill, string>> = {
  [VoteMode.AVAILABLE]: {
    none: "bg-white dark:bg-zinc-900",
    partial: "bg-emerald-200 dark:bg-emerald-700",
    full: "bg-emerald-500 dark:bg-emerald-600",
  },
  [VoteMode.UNAVAILABLE]: {
    none: "bg-white dark:bg-zinc-900",
    partial: "bg-rose-200 dark:bg-rose-800",
    full: "bg-rose-500 dark:bg-rose-500",
  },
};

const PARTIAL_STRIPES: Record<VoteMode, string> = {
  [VoteMode.AVAILABLE]:
    "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(16, 185, 129, 0.4) 4px, rgba(16, 185, 129, 0.4) 8px)",
  [VoteMode.UNAVAILABLE]:
    "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(244, 63, 94, 0.4) 4px, rgba(244, 63, 94, 0.4) 8px)",
};

/**
 * Both stripe layers stay mounted so a mode switch can cross-fade them:
 * background-image itself is not animatable, and a partial cell stays partial
 * in both modes.
 */
const STRIPE_MODES: VoteMode[] = [VoteMode.AVAILABLE, VoteMode.UNAVAILABLE];

export function GridDefaultPreview({
  granularity,
  voteMode,
}: GridDefaultPreviewProps) {
  const t = useTranslations("eventPreference.gridDefault");
  // Same cell height as the voting grid: a coarser granularity means fewer,
  // not taller, cells — exactly what the host will see while voting.
  const { slotHeight } = useResponsiveGrid();

  const rows = useMemo(
    () => buildPreviewRows(granularity, voteMode),
    [granularity, voteMode],
  );

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{t("previewLabel")}</p>

      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 pt-2 pb-2 sm:px-4 sm:pb-4">
        <div
          role="img"
          aria-label={t("previewAria", { granularity })}
          // Display only: the host configures with the controls above, not here.
          className="pointer-events-none select-none p-1"
        >
          {/* The row count is what granularity changes, so the grid grows and
            shrinks; animating this height turns the switch into a resize. The
            extra 0.5rem is the inner top padding that keeps the first time
            label from being clipped, and the 2px is the grid's own top and
            bottom border — without it overflow-hidden clips the bottom rule. */}
          <div
            className="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
            style={{
              height: `calc(${rows.length} * ${slotHeight} + 0.5rem + 2px)`,
            }}
          >
            {/* Remounted per granularity so the new rows fade in over the
              resize; a mode switch keeps the same cells and only recolors. */}
            <div
              key={granularity}
              className="flex pt-2 animate-in fade-in duration-200 motion-reduce:animate-none"
            >
              <TimeColumn mergedTimeRows={rows} slotHeight={slotHeight} />

              <div
                className="flex-1 border border-gray-200 dark:border-zinc-700 rounded-r-lg overflow-hidden"
                style={{ "--slot-height": slotHeight } as React.CSSProperties}
              >
                {rows.map((row) => (
                  <div key={row.startMinute} className="flex">
                    {row.cells.map((fill, dayIndex) => (
                      <div
                        key={PREVIEW_DAYS[dayIndex]}
                        className={cn(
                          "flex-1 min-w-0 relative border-r border-b border-gray-100 dark:border-zinc-800",
                          "transition-colors duration-300 ease-out motion-reduce:transition-none",
                          FILL_CLASSES[voteMode][fill],
                        )}
                        style={{ height: "var(--slot-height, 2.5rem)" }}
                      >
                        {fill === "partial" &&
                          STRIPE_MODES.map((stripeMode) => (
                            <div
                              key={stripeMode}
                              className="absolute inset-0 transition-opacity duration-300 ease-out motion-reduce:transition-none"
                              style={{
                                backgroundImage: PARTIAL_STRIPES[stripeMode],
                                opacity: stripeMode === voteMode ? 0.3 : 0,
                              }}
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
