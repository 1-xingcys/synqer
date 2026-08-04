"use client";

interface SectionSeparatorProps {
  label: string;
}

export function SectionSeparator({ label }: SectionSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}
