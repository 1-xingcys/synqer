"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { VoteMode } from "@/types/event";
import { TimeGranularity } from "../types";

interface GridToolsMenuProps {
  voteMode: VoteMode;
  onModeChange: (mode: VoteMode) => void;
  granularity: TimeGranularity;
  onGranularityChange: (granularity: TimeGranularity) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  calendarStatus: { connected: boolean; googleEmail?: string } | null;
  onOpenCalendarPanel: () => void;
  onDisconnectCalendar: () => Promise<void>;
}

const GRANULARITY_ITEMS: { value: TimeGranularity; label: string }[] = [
  { value: 15, label: "view15min" },
  { value: 30, label: "view30min" },
  { value: 60, label: "view1hr" },
];

export function GridToolsMenu({
  voteMode,
  onModeChange,
  granularity,
  onGranularityChange,
  onSelectAll,
  onClearSelection,
  calendarStatus,
  onOpenCalendarPanel,
  onDisconnectCalendar,
}: GridToolsMenuProps) {
  const tJoined = useTranslations("joined");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCalendarConnected = Boolean(calendarStatus?.connected);

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

  const modeButtons = (
    <>
      <button
        onClick={() => {
          onModeChange(VoteMode.AVAILABLE);
          setOpen(false);
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm flex items-center justify-between ${
          voteMode === VoteMode.AVAILABLE
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
        }`}
      >
        <span>{tJoined("voteModeAvailable")}</span>
        {voteMode === VoteMode.AVAILABLE && <Check className="w-4 h-4" />}
      </button>
      <button
        onClick={() => {
          onModeChange(VoteMode.UNAVAILABLE);
          setOpen(false);
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm flex items-center justify-between ${
          voteMode === VoteMode.UNAVAILABLE
            ? "bg-[#fff1f2] text-[#be123c] dark:bg-[#881337]/30 dark:text-[#fda4af]"
            : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
        }`}
      >
        <span>{tJoined("voteModeUnavailable")}</span>
        {voteMode === VoteMode.UNAVAILABLE && <X className="w-4 h-4" />}
      </button>
    </>
  );

  const granularityButtons = GRANULARITY_ITEMS.map((item) => (
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
      <span>{tJoined(`mobileTools.${item.label}`)}</span>
      {granularity === item.value && <Check className="w-4 h-4" />}
    </button>
  ));

  const quickActionButtons = (
    <>
      <button
        onClick={() => {
          onSelectAll();
          setOpen(false);
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40 text-left`}
      >
        {tJoined("selectAll")}
      </button>
      <button
        onClick={() => {
          onClearSelection();
          setOpen(false);
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40 text-left`}
      >
        {tJoined("clearSelection")}
      </button>
    </>
  );

  const integrationButtons = !isCalendarConnected ? (
    <button
      onClick={() => {
        onOpenCalendarPanel();
        setOpen(false);
      }}
      className={`w-full px-3 py-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40 text-left`}
    >
      {tJoined("googleCalendar.connect")}
    </button>
  ) : (
    <>
      <button
        onClick={() => {
          onOpenCalendarPanel();
          setOpen(false);
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40 text-left`}
      >
        {tJoined("googleCalendar.settings")}
      </button>
      <button
        onClick={() => {
          void onDisconnectCalendar();
          setOpen(false);
        }}
        className="w-full px-3 py-2 text-left text-xs sm:text-sm text-rose-600 dark:text-rose-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/40"
      >
        {tJoined("googleCalendar.disconnect")}
      </button>
    </>
  );

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
            {tJoined("mobileTools.mode")}
          </div>
          {modeButtons}

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("mobileTools.view")}
          </div>
          {granularityButtons}

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("mobileTools.quickActions")}
          </div>
          {quickActionButtons}

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {tJoined("mobileTools.integration")}
          </div>
          {integrationButtons}
        </div>
      )}
    </div>
  );
}
