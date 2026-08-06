import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/features/time-grid/ui";

/**
 * Placeholder for the vote tab body. Presentational only — the caller supplies
 * the SkeletonRegion that announces the load.
 */
export function VoteTabSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Voting instruction hint */}
      <div className="flex justify-center">
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="bg-white dark:bg-zinc-900 shadow rounded-lg border border-gray-200 dark:border-zinc-800 px-2 pb-2 sm:px-6 sm:pb-6">
        <GridSkeleton showToolbar />
      </div>
    </div>
  );
}
