import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRegion } from "@/components/ui/skeleton-region";

/**
 * Placeholder for the event list. Mirrors EventRow's two layouts — the desktop
 * single row and the mobile two-line row — so neither breakpoint reflows when
 * the real rows arrive.
 */

// Fewer than a full page of 10: rows appearing is calmer than rows vanishing.
const ROW_COUNT = 5;

// Varied widths so the placeholder reads as a list of differently named events
// rather than a stack of identical bars.
const TITLE_WIDTHS = ["w-56", "w-40", "w-64", "w-48"];
const HOST_WIDTHS = ["w-14", "w-11", "w-16", "w-12"];

function SkeletonRow({ index }: { index: number }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const hostWidth = HOST_WIDTHS[index % HOST_WIDTHS.length];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
      {/* Desktop — matches EventRow's `hidden md:flex` row */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3">
        <div className="w-6 shrink-0">
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <Skeleton className={`h-4 max-w-full ${titleWidth}`} />
        </div>
        <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className={`h-3 ${hostWidth}`} />
        </div>
        <div className="shrink-0 min-w-[160px]">
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="shrink-0 min-w-[60px]">
          <Skeleton className="h-3 w-11" />
        </div>
      </div>

      {/* Mobile — matches EventRow's `md:hidden` two-line row */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className={`h-6 max-w-full ${titleWidth}`} />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-9" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventListSkeleton() {
  return (
    <SkeletonRegion className="space-y-4">
      {/* "Showing x–y of n" */}
      <Skeleton className="h-5 w-40" />

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {Array.from({ length: ROW_COUNT }).map((_, index) => (
          <SkeletonRow key={index} index={index} />
        ))}
      </div>
    </SkeletonRegion>
  );
}
