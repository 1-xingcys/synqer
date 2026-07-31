"use client";

/**
 * TEMPORARY on-screen loading timeline.
 *
 * Shows every stage recorded by lib/perfTrace, including stages from previous
 * documents in the same LIFF launch, so the slow hop is visible without a
 * desktop debugger. Delete together with lib/perfTrace.ts.
 */

import { useEffect, useState } from "react";
import {
  PERF_TRACE_ENABLED,
  clearPerfTrace,
  formatPerfTrace,
  getPerfTrace,
  perfMark,
  subscribeToPerfTrace,
  type PerfMark,
} from "@/lib/perfTrace";

/** Stages slower than this are highlighted as suspects. */
const SLOW_MS = 300;
const VERY_SLOW_MS = 1000;

interface Row extends PerfMark {
  total: number;
  delta: number;
}

export function PerfTraceOverlay() {
  const [marks, setMarks] = useState<PerfMark[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!PERF_TRACE_ENABLED) return undefined;

    perfMark("react · overlay mounted (hydrated)");

    const apply = (data: { startedAt: number; marks: PerfMark[] }) => {
      setStartedAt(data.startedAt);
      setMarks(data.marks);
    };
    apply(getPerfTrace());
    return subscribeToPerfTrace(apply);
  }, []);

  if (!PERF_TRACE_ENABLED || marks.length === 0) return null;

  const rows: Row[] = marks.map((mark, index) => ({
    ...mark,
    total: mark.at - startedAt,
    delta: index === 0 ? 0 : mark.at - marks[index - 1].at,
  }));
  const total = rows[rows.length - 1].total;

  const copy = async () => {
    const text = formatPerfTrace({
      startedAt,
      navCount: marks[marks.length - 1].nav,
      marks,
    });
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-[9999] rounded-full bg-black/85 px-3 py-2 font-mono text-[11px] text-white shadow-lg"
      >
        ⏱ {(total / 1000).toFixed(2)}s
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] max-h-[55vh] overflow-auto bg-black/92 font-mono text-[10px] leading-tight text-white backdrop-blur-sm">
      <div className="sticky top-0 flex items-center justify-between gap-2 bg-zinc-800 px-2 py-1.5">
        <span className="font-bold">
          ⏱ load trace · {(total / 1000).toFixed(2)}s · {rows.length} marks
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => void copy()}
            className="rounded bg-zinc-600 px-2 py-1"
          >
            {copied ? "copied" : "copy"}
          </button>
          <button
            onClick={() => {
              clearPerfTrace();
              window.location.reload();
            }}
            className="rounded bg-zinc-600 px-2 py-1"
          >
            reset
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded bg-red-600 px-2 py-1"
          >
            hide
          </button>
        </div>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, index) => {
            const isSection = row.label.startsWith("━━");
            const tone =
              row.delta >= VERY_SLOW_MS
                ? "text-red-400"
                : row.delta >= SLOW_MS
                  ? "text-amber-400"
                  : "text-zinc-500";
            return (
              <tr
                key={`${row.at}-${index}`}
                className={
                  isSection
                    ? "bg-blue-950/70 text-blue-200"
                    : "border-b border-zinc-800"
                }
              >
                <td className="w-14 whitespace-nowrap px-1 py-0.5 text-right text-zinc-400">
                  +{row.total}
                </td>
                <td
                  className={`w-14 whitespace-nowrap px-1 py-0.5 text-right ${tone}`}
                >
                  {row.delta > 0 ? `Δ${row.delta}` : ""}
                </td>
                <td className="px-1 py-0.5">
                  <span className={row.delta >= SLOW_MS ? "font-bold" : ""}>
                    {row.label}
                  </span>
                  {row.detail && (
                    <div className="whitespace-pre-wrap break-all text-zinc-400">
                      {row.detail}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
