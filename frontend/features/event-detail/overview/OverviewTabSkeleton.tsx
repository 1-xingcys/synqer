import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder for the overview tab body. Presentational only — the caller
 * supplies the SkeletonRegion.
 *
 * Overview has two layouts: two columns while voting, a single stack once
 * voting has ended. The status isn't known yet at skeleton time, so this draws
 * the voting layout — it is the only one with a sidebar, and collapsing a drawn
 * sidebar into one column reads better than growing a whole column from
 * nothing. Both layouts stack on mobile, so the choice only shows on desktop.
 *
 * Heights are built from the real components' line boxes rather than eyeballed,
 * because both cards are much taller than a few stacked bars suggest:
 * EventInfoDetail is a status strip plus a 2x2 configuration grid, and
 * EventInfoParticipants is two labelled sections of 48px rows.
 */

const CARD =
  "bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 sm:py-5 sm:px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm";

/** Mirrors ConfigurationField: a 20px label row, then a 24px value. */
function ConfigFieldSkeleton({ valueWidth }: { valueWidth: string }) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div className="flex items-center gap-2 mb-1 h-5">
        <Skeleton className="w-4 h-4 shrink-0" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="pl-5 sm:pl-6">
        <Skeleton className={`h-6 max-w-full ${valueWidth}`} />
      </div>
    </div>
  );
}

/** Mirrors ParticipantItem: 32px avatar in 8px padding — a 48px row. */
function ParticipantRowSkeleton({ nameWidth }: { nameWidth: string }) {
  return (
    <div className="flex items-center gap-3 p-2 -mx-2">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <Skeleton className={`h-5 ${nameWidth}`} />
    </div>
  );
}

/** Mirrors the Voted / Not-voted h3: a 16px row with a count on the right. */
function ParticipantGroupHeadingSkeleton({ width }: { width: string }) {
  return (
    <div className="flex items-center justify-between h-4 mb-3">
      <Skeleton className={`h-3.5 ${width}`} />
      <Skeleton className="h-3.5 w-3" />
    </div>
  );
}

export function OverviewTabSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
      <div className="lg:col-span-2 space-y-5">
        <div className={CARD}>
          {/* Status / my voting status strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-4">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>

          {/* "Candidate time range" heading */}
          <div className="flex items-center gap-2 h-7 mb-3 sm:mb-4">
            <Skeleton className="w-5 h-5 shrink-0" />
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Configuration summary: dates, time, zone, deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ConfigFieldSkeleton valueWidth="w-48" />
            <ConfigFieldSkeleton valueWidth="w-32" />
            <ConfigFieldSkeleton valueWidth="w-28" />
            <ConfigFieldSkeleton valueWidth="w-40" />
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className={CARD}>
          {/* "Participants" heading with the count badge */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 h-7">
              <Skeleton className="w-5 h-5 shrink-0" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-6 w-7 rounded-full" />
          </div>

          <div className="space-y-5">
            {/* Voted */}
            <div className="my-2 sm:my-4">
              <ParticipantGroupHeadingSkeleton width="w-14" />
              <div>
                <ParticipantRowSkeleton nameWidth="w-24" />
                <ParticipantRowSkeleton nameWidth="w-16" />
              </div>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3 sm:my-4" />

            {/* Not voted */}
            <div>
              <ParticipantGroupHeadingSkeleton width="w-20" />
              <div className="space-y-3">
                <ParticipantRowSkeleton nameWidth="w-20" />
                <ParticipantRowSkeleton nameWidth="w-28" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
