"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRegion } from "@/components/ui/skeleton-region";
import { OverviewTabSkeleton } from "../overview/OverviewTabSkeleton";
import { ResultsTabSkeleton } from "../results/ResultsTabSkeleton";
import { SettingsTabSkeleton } from "../settings/SettingsTabSkeleton";
import { VoteTabSkeleton } from "../vote/VoteTabSkeleton";

/**
 * Whole-page placeholder for the event detail route: back link, title, tab bar
 * and the active tab's body.
 *
 */
const TAB_WIDTHS = ["w-16", "w-14", "w-16"];

function TabBodySkeleton({ segment }: { segment: string | null }) {
  switch (segment) {
    case "vote":
      return <VoteTabSkeleton />;
    case "results":
      return <ResultsTabSkeleton />;
    case "settings":
      return <SettingsTabSkeleton />;
    // "overview", the participants tab (entry currently disabled) and the
    // index route all land on the overview shape.
    default:
      return <OverviewTabSkeleton />;
  }
}

export function EventDetailShellSkeleton() {
  const segment = useSelectedLayoutSegment();

  return (
    <SkeletonRegion className="py-4 sm:py-8 flex flex-col">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />

      {/* Event title */}
      <div className="mt-5 space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
      </div>

      {/* Tab bar. Mirrors EventDetailNav down to the transparent border-b-2 and
          the nav's -mb-px: the tab item is 24px padding + a 20px text line box
          + a 2px active-underline slot, and the bar pulls itself 1px over its
          own border. Dropping any of the three loses height against the real
          nav — 5px in total. */}
      <div className="mt-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-1 -mb-px">
          {TAB_WIDTHS.map((width, index) => (
            <div
              key={index}
              className="inline-flex items-center px-4 py-3 border-b-2 border-transparent"
            >
              <div className="flex items-center gap-2 h-5">
                <Skeleton className="w-4 h-4" />
                <Skeleton className={`h-4 ${width}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <TabBodySkeleton segment={segment} />
      </div>
    </SkeletonRegion>
  );
}
