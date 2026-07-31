import { Skeleton } from "@/components/ui/skeleton";

/**
 * 表單載入中的佔位畫面。
 *
 * 高度不需要跟真正的表單完全一致 —— 它是頁面上最後一個元素，撐高只會往下長，
 * 不會推動上方已經畫好的標題，所以不影響 CLS。這裡只求視覺節奏接近。
 */
function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CreateEventFormSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="relative">
        <div
          className="absolute left-[0.8rem] lg:left-[2.3rem] w-0.5 bg-border z-[1]"
          style={{ top: "3rem", bottom: "1.5rem" }}
        />
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={2} />
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}
