"use client";

import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/ui/utils";
import {
  Spinner,
  type SpinnerSize,
  type SpinnerTone,
} from "@/components/ui/spinner";

const LOADING_SECTION_HEIGHT = "min-h-[50vh]";

const loadingContainerVariants = cva("flex items-center justify-center", {
  variants: {
    viewport: {
      none: "",
      section: LOADING_SECTION_HEIGHT,
      content: LOADING_SECTION_HEIGHT,
      screen: "min-h-screen",
    },
    background: {
      none: "",
      muted: "bg-zinc-50 dark:bg-black",
      surface: "bg-white dark:bg-zinc-900",
    },
  },
  defaultVariants: {
    viewport: "section",
    background: "none",
  },
});

const loadingContentVariants = cva("flex items-center", {
  variants: {
    layout: {
      column: "flex-col gap-4",
      row: "flex-row gap-2",
    },
  },
  defaultVariants: {
    layout: "column",
  },
});

const loadingTextVariants = cva("text-zinc-600 dark:text-zinc-400", {
  variants: {
    textSize: {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    textSize: "base",
  },
});

export interface LoadingStateProps
  extends VariantProps<typeof loadingContainerVariants>,
    VariantProps<typeof loadingContentVariants>,
    VariantProps<typeof loadingTextVariants> {
  label?: ReactNode;
  spinnerSize?: SpinnerSize;
  spinnerTone?: SpinnerTone;
  className?: string;
  labelClassName?: string;
}

export function LoadingState({
  label,
  viewport,
  background,
  layout,
  textSize,
  spinnerSize = "md",
  spinnerTone = "neutral",
  className,
  labelClassName,
}: LoadingStateProps) {
  const tCommon = useTranslations("common");
  const resolvedLabel = label ?? tCommon("loading");

  return (
    <div
      data-slot="loading-state"
      className={cn(
        loadingContainerVariants({ viewport, background }),
        className,
      )}
    >
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(loadingContentVariants({ layout }))}
      >
        <Spinner size={spinnerSize} tone={spinnerTone} />
        <p className={cn(loadingTextVariants({ textSize }), labelClassName)}>
          {resolvedLabel}
        </p>
      </div>
    </div>
  );
}
