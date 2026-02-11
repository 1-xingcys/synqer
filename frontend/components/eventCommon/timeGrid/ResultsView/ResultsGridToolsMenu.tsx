"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Link2 } from "lucide-react";
import { TimeGranularity } from "../types";

interface ResultsGridToolsMenuProps {
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
  onCopyShareLink: () => void;
  linkCopied: boolean;
}

const GRANULARITY_ITEMS: { value: TimeGranularity; labelKey: string }[] = [
  { value: 15, labelKey: "view15min" },
  { value: 30, labelKey: "view30min" },
  { value: 60, labelKey: "view1hr" },
];

export function ResultsGridToolsMenu({
  granularity,
  onGranularityChange,
  onCopyShareLink,
  linkCopied,
}: ResultsGridToolsMenuProps) {
  const tJoined = useTranslations("joined");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-8 px-2.5 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
          open
            ? "bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400"
            : "bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
        }`}
        aria-label={tJoined("mobileTools.open")}
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M7 12h10M10 18h4"
          />
        </svg>
        <span className="hidden sm:block text-xs sm:text-sm font-medium">
          {tJoined("mobileTools.tools")}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1">
          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("mobileTools.view")}
          </div>
          {GRANULARITY_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onGranularityChange(item.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-xs sm:text-sm flex items-center justify-between ${
                granularity === item.value
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
              }`}
            >
              <span>{tJoined(`mobileTools.${item.labelKey}`)}</span>
              {granularity === item.value && <Check className="w-4 h-4" />}
            </button>
          ))}

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("results.copyLink")}
          </div>
          <button
            onClick={() => {
              onCopyShareLink();
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center gap-2 ${
              linkCopied
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
            }`}
          >
            {linkCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            <span>
              {linkCopied
                ? tJoined("results.linkCopied")
                : tJoined("results.copyLink")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
