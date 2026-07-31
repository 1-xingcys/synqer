/**
 * TEMPORARY loading instrumentation.
 *
 * Opening the app from LINE goes through several *hard* navigations
 * (liff.line.me -> our origin with liff.state -> real path -> maybe LINE Login),
 * and every one of them throws away the JS heap. A trace that only lives in
 * memory would therefore only ever show the last hop.
 *
 * So marks are accumulated in sessionStorage with absolute epoch timestamps,
 * which makes the gaps *between* documents (LINE redirect + DNS + TTFB) just as
 * visible as the in-page stages.
 *
 * Remove this file, PerfTraceOverlay and every perfMark/perfSpan call site once
 * the slow stage has been identified.
 */

/** Master switch. Set to false to disable the overlay and all bookkeeping. */
export const PERF_TRACE_ENABLED = true;

const STORAGE_KEY = "synqer:perf-trace";
const MAX_MARKS = 400;

export interface PerfMark {
  /** Stage name */
  label: string;
  /** Absolute epoch ms, comparable across page loads */
  at: number;
  /** Which document load produced this mark */
  nav: number;
  /** Optional extra lines shown under the label */
  detail?: string;
}

interface PerfTraceData {
  startedAt: number;
  navCount: number;
  marks: PerfMark[];
}

const isClient = typeof window !== "undefined";

let cache: PerfTraceData | null = null;
let currentNav = 0;
let initialized = false;
const subscribers = new Set<(data: PerfTraceData) => void>();

function emptyData(): PerfTraceData {
  return { startedAt: Date.now(), navCount: 0, marks: [] };
}

function read(): PerfTraceData {
  if (cache) return cache;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PerfTraceData;
      if (Array.isArray(parsed.marks)) {
        cache = parsed;
      }
    }
  } catch {
    // sessionStorage may be unavailable; fall through to a fresh trace
  }
  if (!cache) cache = emptyData();
  return cache;
}

function write(data: PerfTraceData): void {
  cache = data;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or privacy mode: keep the in-memory copy only
  }
  subscribers.forEach((callback) => callback(data));
}

function formatDetail(detail?: unknown): string | undefined {
  if (detail === undefined || detail === null) return undefined;
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail) ?? "[unserializable]";
  } catch {
    return "[unserializable]";
  }
}

function pushMark(label: string, at: number, detail?: unknown): void {
  const data = read();
  const marks = [
    ...data.marks,
    {
      label,
      at: Math.round(at),
      nav: currentNav,
      detail: formatDetail(detail),
    },
  ];
  marks.sort((a, b) => a.at - b.at);
  write({ ...data, marks: marks.slice(-MAX_MARKS) });
}

/** Record a stage boundary at the current time. */
export function perfMark(label: string, detail?: unknown): void {
  if (!PERF_TRACE_ENABLED || !isClient) return;
  ensureInitialized();
  pushMark(label, Date.now(), detail);
}

/**
 * Time an async stage: records `label` on entry and `label ✓` with the elapsed
 * duration on exit (including when it throws).
 */
export async function perfSpan<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T> {
  if (!PERF_TRACE_ENABLED || !isClient) return run();
  const startedAt = Date.now();
  perfMark(label);
  try {
    return await run();
  } finally {
    perfMark(`${label} ✓`, `${Date.now() - startedAt}ms`);
  }
}

export function subscribeToPerfTrace(
  callback: (data: PerfTraceData) => void,
): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function getPerfTrace(): PerfTraceData {
  if (!PERF_TRACE_ENABLED || !isClient) return emptyData();
  ensureInitialized();
  return read();
}

export function clearPerfTrace(): void {
  if (!isClient) return;
  cache = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  currentNav = 0;
  initialized = false;
  ensureInitialized();
}

/** Render the whole trace as plain text, for copy & paste. */
export function formatPerfTrace(data: PerfTraceData): string {
  const lines = data.marks.map((mark, index) => {
    const total = mark.at - data.startedAt;
    const delta = index === 0 ? 0 : mark.at - data.marks[index - 1].at;
    const head = `+${total}ms  (Δ${delta}ms)  [nav ${mark.nav}] ${mark.label}`;
    return mark.detail ? `${head}\n        ${mark.detail}` : head;
  });
  return [
    `Synqer LIFF load trace — total ${
      data.marks.length
        ? data.marks[data.marks.length - 1].at - data.startedAt
        : 0
    }ms over ${data.navCount} document load(s)`,
    ...lines,
  ].join("\n");
}

function ms(value: number): string {
  return `${Math.round(value)}ms`;
}

/**
 * Turn the browser's own Navigation Timing into marks, so redirect / DNS /
 * TLS / server / HTML-download time is attributed instead of hiding inside a
 * single "page was loading" gap.
 */
function captureDocumentTimings(): void {
  const entry = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | null;
  if (!entry) return;

  const origin = performance.timeOrigin;
  const detail = [
    `redirect ${ms(entry.redirectEnd - entry.redirectStart)}`,
    `dns ${ms(entry.domainLookupEnd - entry.domainLookupStart)}`,
    `tcp+tls ${ms(entry.connectEnd - entry.connectStart)}`,
    `ttfb ${ms(entry.responseStart - entry.requestStart)}`,
    `html ${ms(entry.responseEnd - entry.responseStart)}`,
    `dom interactive ${ms(entry.domInteractive)}`,
    `dom content loaded ${ms(entry.domContentLoadedEventEnd)}`,
    `load ${ms(entry.loadEventEnd || performance.now())}`,
    `type ${entry.type}`,
  ].join(" | ");

  pushMark(
    `nav ${currentNav} · document breakdown`,
    origin + (entry.loadEventEnd || performance.now()),
    detail,
  );

  const slowest = performance
    .getEntriesByType("resource")
    .filter((resource) => resource.duration > 150)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 6)
    .map((resource) => `${ms(resource.duration)} ${shortUrl(resource.name)}`);

  if (slowest.length) {
    pushMark(
      `nav ${currentNav} · slowest resources`,
      origin + (entry.loadEventEnd || performance.now()),
      slowest.join(" | "),
    );
  }
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const file = parsed.pathname.split("/").pop() || parsed.pathname;
    return `${parsed.host}/…/${file}`;
  } catch {
    return url;
  }
}

function observePaint(): void {
  const observe = (type: string) => {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          pushMark(
            `paint · ${entry.name || type}`,
            performance.timeOrigin + entry.startTime,
          );
        });
      });
      observer.observe({ type, buffered: true });
    } catch {
      // Not supported in this browser (LCP is missing on iOS Safari/LINE)
    }
  };
  observe("paint");
  observe("largest-contentful-paint");
}

/**
 * Runs once per document: opens a new navigation section in the trace and
 * wires up the browser-level observers.
 */
function ensureInitialized(): void {
  if (initialized || !isClient || !PERF_TRACE_ENABLED) return;
  initialized = true;

  const data = read();
  currentNav = data.navCount + 1;
  write({ ...data, navCount: currentNav });

  const origin = performance.timeOrigin;
  pushMark(
    `━━ nav ${currentNav} start`,
    origin,
    `${window.location.pathname}${window.location.search.slice(0, 120)}`,
  );
  pushMark(`nav ${currentNav} · client JS eval`, origin + performance.now());

  observePaint();

  if (document.readyState === "complete") {
    captureDocumentTimings();
  } else {
    window.addEventListener("load", () => {
      // loadEventEnd is only final after the load handlers have run
      setTimeout(captureDocumentTimings, 0);
    });
  }
}

if (isClient && PERF_TRACE_ENABLED) {
  ensureInitialized();
}
