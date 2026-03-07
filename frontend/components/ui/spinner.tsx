import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-solid border-t-transparent",
  {
    variants: {
      size: {
        xs: "h-3.5 w-3.5 border-2",
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-2",
        lg: "h-10 w-10 border-4",
        xl: "h-12 w-12 border-4",
      },
      tone: {
        primary: "border-blue-600 border-t-transparent",
        neutral: "border-zinc-300 border-t-zinc-600",
        current: "border-current border-t-transparent",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "primary",
    },
  },
);

export type SpinnerSize = NonNullable<
  VariantProps<typeof spinnerVariants>["size"]
>;
export type SpinnerTone = NonNullable<
  VariantProps<typeof spinnerVariants>["tone"]
>;

export interface SpinnerProps
  extends ComponentProps<"span">,
    VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, tone, ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      className={cn(spinnerVariants({ size, tone }), className)}
      {...props}
    />
  );
}
