import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/features/time-grid/ui";

/**
 * Placeholder for the results tab body, shared by the host and guest views.
 *
 * The host reaches this twice — once behind the detail-page shell skeleton, once
 * while its own /hosted query runs — so reusing one component keeps that as a
 * single continuous skeleton instead of a skeleton followed by a spinner.
 *
 * Presentational only: the caller supplies the SkeletonRegion.
 */
export function ResultsTabSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-center">
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-3 sm:p-5 mt-3 sm:mt-4">
        {/* Heat map legend + participant filter */}
        <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-9.5 w-40" />
        </div>

        <div className="mt-3 border-t border-zinc-200 dark:border-zinc-700" />

        <div className="mt-3">
          <GridSkeleton showToolbar />
        </div>
      </div>
    </div>
  );
}
