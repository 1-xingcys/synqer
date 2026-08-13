"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import {
  FLOW_MEDIA,
  FLOW_MODES,
  FLOW_STEPS,
  flowMediaSrc,
  type FlowMode,
  type FlowStep,
} from "./flowSteps";

/**
 * One capture, filling the frame its parent has already reserved.
 *
 * `className` is what decides whether this copy is the one on screen, so the
 * two themes can be told apart without either of them knowing the theme.
 */
function Capture({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={`object-cover ${className ?? ""}`}
      sizes={sizes}
      // Captures are hand-made and already sized; re-encoding a GIF through
      // the optimizer would drop its animation.
      unoptimized
    />
  );
}

/**
 * The capture for one step, or the space it will occupy.
 *
 * No frame around it: a phone bezel or browser chrome drawn in CSS competes
 * with whatever chrome is already inside the screenshot. Rounded corners and
 * a soft shadow are enough to lift it off the page.
 *
 * The theme is picked in CSS rather than in JavaScript. next-themes only puts
 * its class on `<html>` once the client has run, so choosing a `src` from the
 * active theme would mean rendering nothing on the server and swapping the
 * image in afterwards — visible, on the first screen of the page. Emitting
 * both copies and letting `dark:` decide costs one extra node and nothing
 * else: a `display: none` image with `loading="lazy"` is never fetched, so the
 * theme a reader is not using is not downloaded until they switch to it.
 */
function StepMedia({
  step,
  mode,
  alt,
  pendingLabel,
}: {
  step: FlowStep;
  mode: FlowMode;
  alt: string;
  pendingLabel: string;
}) {
  const { aspect, maxWidth, pixels } = FLOW_MEDIA[mode];
  const active = useLocale();
  const locale = isLocale(active) ? active : DEFAULT_LOCALE;
  const sizes = `(max-width: 1024px) 100vw, ${maxWidth}`;

  const light = flowMediaSrc(step, "light", locale);
  const dark = flowMediaSrc(step, "dark", locale);

  return (
    <div className="w-full" style={{ maxWidth }}>
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-lg shadow-zinc-900/10 dark:shadow-black/40"
        style={{ aspectRatio: aspect }}
      >
        {light !== null && dark !== null ? (
          // Both themes fall back to one capture until the other is shot, and
          // a second copy of the same file would only ever be the hidden one.
          light === dark ? (
            <Capture src={light} alt={alt} sizes={sizes} />
          ) : (
            <>
              <Capture
                src={light}
                alt={alt}
                sizes={sizes}
                className="dark:hidden"
              />
              <Capture
                src={dark}
                alt={alt}
                sizes={sizes}
                className="hidden dark:block"
              />
            </>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl px-4 text-center">
            <svg
              className="w-7 h-7 text-zinc-400 dark:text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 6.75h.008v.008H18V6.75zM2.25 19.5V4.5A2.25 2.25 0 014.5 2.25h15A2.25 2.25 0 0121.75 4.5v15a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 19.5z"
              />
            </svg>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {pendingLabel}
            </p>
            <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 break-all">
              landing/{locale}/&lt;theme&gt;/{step.file}
            </p>
            <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              {pixels}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The four steps of a flow, one per row.
 *
 * Rows alternate which side the capture sits on. Four identical rows read as
 * a table; alternating them keeps the eye moving down the sequence.
 *
 * The text comes first in the DOM so that stacking it — on mobile, and for a
 * screen reader — names the step before showing it. That inverts what the
 * alternation has to do: a row wanting its capture on the left is now the
 * reversed one.
 */
function FlowSteps({ mode }: { mode: FlowMode }) {
  const t = useTranslations("landing.flow");

  return (
    <ol className="space-y-12 md:space-y-16">
      {FLOW_STEPS[mode].map((step, index) => (
        <li
          key={step.key}
          // Staggered so the steps arrive in the order they happen.
          style={
            { "--reveal-delay": `${index * 0.08}s` } as React.CSSProperties
          }
          className={`animate-rise flex flex-col gap-6 md:gap-10 lg:flex-row lg:items-center ${
            index % 2 === 0 ? "lg:flex-row-reverse" : ""
          }`}
        >
          <div className="w-full lg:w-1/2">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom right, #6780c7, #78b0e0)",
                }}
              >
                {index + 1}
              </span>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {t(`${mode}.${step.key}.title`)}
              </h3>
            </div>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t(`${mode}.${step.key}.description`)}
            </p>
          </div>

          <div className="flex w-full justify-center lg:w-1/2">
            <StepMedia
              step={step}
              mode={mode}
              alt={t(`${mode}.${step.key}.title`)}
              pendingLabel={t("mediaPending")}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * The one thing this page is for: showing how the product is used.
 *
 * Both routes end at the same place, so they are tabs rather than two columns
 * — side by side they invited a comparison that has no answer, since which
 * one you want is decided by where your group already talks.
 */
export function UsageFlow() {
  const t = useTranslations("landing.flow");
  const [mode, setMode] = useState<FlowMode>("line");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys move between tabs, which is what a tablist is expected to do
  // once it takes the roving focus that `tabIndex` below sets up.
  function handleKeyDown(event: React.KeyboardEvent) {
    const offset =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    if (offset === 0) return;

    event.preventDefault();
    const next =
      FLOW_MODES[
        (FLOW_MODES.indexOf(mode) + offset + FLOW_MODES.length) %
          FLOW_MODES.length
      ];
    setMode(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <h2 className="animate-rise text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-8 md:mb-12">
        {t("title")}
      </h2>

      <div
        role="tablist"
        aria-label={t("title")}
        onKeyDown={handleKeyDown}
        style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
        className="animate-rise mx-auto mb-12 md:mb-16 flex w-fit gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1"
      >
        {FLOW_MODES.map((candidate) => {
          const selected = candidate === mode;

          return (
            <button
              key={candidate}
              ref={(node) => {
                tabRefs.current[candidate] = node;
              }}
              role="tab"
              type="button"
              id={`flow-tab-${candidate}`}
              aria-selected={selected}
              aria-controls={`flow-panel-${candidate}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setMode(candidate)}
              className={`px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                selected
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {t(`tabs.${candidate}`)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`flow-panel-${mode}`}
        aria-labelledby={`flow-tab-${mode}`}
        className="max-w-5xl mx-auto"
      >
        {/* Keyed by mode so switching tabs remounts the list and the entrance
            plays again — the steps arriving one after another is what shows
            the reader they are looking at a different route, not a redraw. */}
        <FlowSteps key={mode} mode={mode} />
      </div>
    </section>
  );
}
