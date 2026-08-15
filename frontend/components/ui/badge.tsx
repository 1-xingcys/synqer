"use client";

import { Check, UserPlus, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui/utils";

type BadgeVariant = "registered" | "notRegistered" | "voted" | "notVoted";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

const variantStyles: Record<
  BadgeVariant,
  { containerClass: string; Icon: LucideIcon }
> = {
  registered: {
    containerClass: "text-green-600 dark:text-green-400",
    Icon: Check,
  },
  notRegistered: {
    containerClass: "text-amber-600 dark:text-amber-400",
    Icon: UserPlus,
  },
  voted: {
    containerClass: "text-green-600 dark:text-green-400",
    Icon: Check,
  },
  notVoted: {
    containerClass: "text-amber-600 dark:text-amber-400",
    Icon: Clock,
  },
};

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const { containerClass, Icon } = variantStyles[variant];

  return (
    <div
      className={cn(
        "text-xs flex items-center gap-1",
        containerClass,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
}
