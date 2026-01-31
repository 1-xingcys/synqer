"use client";

import { ChevronRight } from "lucide-react";

export const ActionButtonVariant = {
  Default: "default",
  Highlight: "highlight",
  Success: "success",
  Error: "error",
} as const;
export type ActionButtonVariant =
  (typeof ActionButtonVariant)[keyof typeof ActionButtonVariant];

const styles = {
  [ActionButtonVariant.Default]: {
    container:
      "bg-background border-border/60 hover:border-primary/30 hover:shadow-md",
    iconBg: "bg-muted text-muted-foreground",
    text: "text-foreground",
  },
  [ActionButtonVariant.Highlight]: {
    container:
      "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 hover:shadow-md",
    iconBg: "bg-primary text-primary-foreground",
    text: "text-primary-foreground dark:text-primary",
  },
  [ActionButtonVariant.Success]: {
    container:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    iconBg: "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400",
    text: "text-green-700 dark:text-green-400",
  },
  [ActionButtonVariant.Error]: {
    container:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    iconBg: "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400",
    text: "text-red-700 dark:text-red-400",
  },
};

export interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: ActionButtonVariant;
  showArrow?: boolean;
}

export function ActionButton({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  variant = ActionButtonVariant.Default,
  showArrow = false,
}: ActionButtonProps) {
  const currentStyle = styles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
        currentStyle.container
      } ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer active:scale-[0.98]"
      }`}
    >
      {/* Icon Container - 增加圓角方形背景，更像 App Icon */}
      <div
        className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${currentStyle.iconBg}`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p
          className={`text-sm font-semibold ${variant === ActionButtonVariant.Highlight ? "text-primary" : "text-foreground"}`}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {description}
        </p>
      </div>

      {/* 導航箭頭 */}
      {showArrow && (
        <div className="shrink-0 text-muted-foreground/50 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </button>
  );
}
