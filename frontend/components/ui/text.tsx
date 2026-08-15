import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui/utils";

const textVariants = cva("", {
  variants: {
    variant: {
      body: "text-sm text-zinc-700 dark:text-zinc-300",
      hint: "text-xs sm:text-sm text-muted-foreground",
      caption: "text-xs text-muted-foreground",
    },
    align: {
      start: "text-left",
      center: "text-center",
    },
  },
  defaultVariants: {
    variant: "body",
    align: "start",
  },
});

type TextProps = React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span";
  };

export function Text({
  as: Tag = "p",
  variant,
  align,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(textVariants({ variant, align }), className)}
      {...props}
    />
  );
}
