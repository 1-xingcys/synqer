import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder for the settings tab body. Presentational only — the caller
 * supplies the SkeletonRegion.
 */
function SectionSkeleton({
  titleWidth,
  children,
}: {
  titleWidth: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <Skeleton className={`h-6 ${titleWidth}`} />
      <hr className="my-2 border-t border-gray-300" />
      <div className="pt-2">{children}</div>
    </section>
  );
}

/** A label with a switch on the right, matching the two preference sections. */
function ToggleRowSkeleton({ labelWidth }: { labelWidth: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Skeleton className={`h-3 ${labelWidth}`} />
      <Skeleton className="h-6 w-11 rounded-full" />
    </div>
  );
}

export function SettingsTabSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Invite link */}
      <SectionSkeleton titleWidth="w-28">
        <Skeleton className="h-10 w-full" />
      </SectionSkeleton>

      {/* Voting deadline */}
      <SectionSkeleton titleWidth="w-24">
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </SectionSkeleton>

      {/* Vote notice */}
      <SectionSkeleton titleWidth="w-32">
        <ToggleRowSkeleton labelWidth="w-48" />
      </SectionSkeleton>

      {/* Grid defaults */}
      <SectionSkeleton titleWidth="w-28">
        <ToggleRowSkeleton labelWidth="w-40" />
      </SectionSkeleton>

      {/* Delete event */}
      <SectionSkeleton titleWidth="w-20">
        <Skeleton className="h-9 w-32" />
      </SectionSkeleton>
    </div>
  );
}
