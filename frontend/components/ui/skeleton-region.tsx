"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface SkeletonRegionProps {
  children: ReactNode;
  /** Applied to the content wrapper, not the status element. */
  className?: string;
}

/**
 * Announces "loading" the way LoadingState does, while hiding the placeholder
 * bars themselves — they carry no meaning once read aloud.
 *
 * Only wrap the outermost skeleton of a screen: nesting these would announce
 * the same load several times.
 */
export function SkeletonRegion({ children, className }: SkeletonRegionProps) {
  const tCommon = useTranslations("common");

  return (
    <div data-slot="skeleton-region" role="status" aria-busy="true">
      <span className="sr-only">{tCommon("loading")}</span>
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}
