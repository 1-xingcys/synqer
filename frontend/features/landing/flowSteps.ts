/**
 * The four steps of each way into the product, and the capture that shows it.
 *
 * The two flows are deliberately the same four steps: what changes between
 * them is only how the event travels — a LINE card, or a link you paste
 * anywhere. Keeping the step keys identical is what lets the tabs read as two
 * routes through one process rather than two products.
 */

import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";

export const FLOW_MODES = ["line", "web"] as const;

export type FlowMode = (typeof FLOW_MODES)[number];

/**
 * Where the captures live.
 *
 * They sit in an R2 bucket rather than `public/` because they are the heaviest
 * thing on the page and they change on their own schedule — a new capture
 * should not need a rebuild and a new image.
 */
export const FLOW_MEDIA_BASE = "https://assets.synqer.club";

/** The site themes a capture can be shot against — next-themes' resolved values. */
export const FLOW_THEMES = ["light", "dark"] as const;

export type FlowTheme = (typeof FLOW_THEMES)[number];

/**
 * One shot combination, which is also the directory it lives in.
 *
 * Locale and theme are path segments rather than filename suffixes so that a
 * whole locale or a whole theme uploads as one folder, and so that the hyphen
 * inside `zh-TW` never has to be told apart from a separator.
 */
export type FlowVariant = `${Locale}/${FlowTheme}`;

export interface FlowStep {
  /** Also the translation key under `landing.flow.<mode>`. */
  key: string;
  /** Leaf object name, below the variant directory. */
  file: string;
  /**
   * Which variants have actually been shot.
   *
   * Existence is declared here rather than discovered at runtime: probing for
   * a missing object would cost a 404 and a flash of broken image, and could
   * not run during SSR at all. Empty means the step renders a placeholder
   * holding exactly the space its capture will occupy, so dropping the capture
   * in later does not reflow the page.
   */
  captured: readonly FlowVariant[];
}

export const FLOW_STEPS: Record<FlowMode, FlowStep[]> = {
  line: [
    { key: "create", file: "line-step-1.png", captured: [] },
    { key: "collect", file: "line-step-2.png", captured: [] },
    { key: "inspect", file: "line-step-3.png", captured: [] },
    { key: "confirm", file: "line-step-4.png", captured: [] },
  ],
  web: [
    { key: "create", file: "web-step-1.png", captured: [] },
    { key: "collect", file: "web-step-2.png", captured: [] },
    { key: "inspect", file: "web-step-3.png", captured: [] },
    { key: "confirm", file: "web-step-4.png", captured: [] },
  ],
};

/**
 * The shape each mode's captures are expected in.
 *
 * The LINE flow happens on a phone and the web flow on a desktop, so forcing
 * both into one frame would letterbox whichever lost. Reserving the true
 * shape per mode means the placeholder occupies exactly what the capture will.
 */
export const FLOW_MEDIA: Record<
  FlowMode,
  { aspect: string; maxWidth: string; pixels: string }
> = {
  // The phone capture is held narrower than the column allows. At the full
  // width its 9:16 makes a row twice as tall as the two lines of text beside
  // it, and the pair stops reading as one step.
  line: { aspect: "9 / 16", maxWidth: "15rem", pixels: "1170 × 2080" },
  web: { aspect: "16 / 10", maxWidth: "36rem", pixels: "1600 × 1000" },
};

/**
 * The best capture available for this reader, or null if the step has none.
 *
 * Locale outranks theme. A light capture on a dark page merely looks a little
 * out of place, while a Chinese capture is unreadable to an English reader —
 * so a matching language is worth giving up a matching theme for.
 *
 * Both themes draw from the same four candidates in a different order, so the
 * two calls a step makes are null together or not at all: whenever anything
 * has been shot, both themes resolve to something.
 */
export function flowMediaSrc(
  step: FlowStep,
  theme: FlowTheme,
  locale: Locale,
): string | null {
  const fallbackTheme: FlowTheme = theme === "dark" ? "light" : "dark";

  const preference: FlowVariant[] = [
    `${locale}/${theme}`,
    `${locale}/${fallbackTheme}`,
    `${DEFAULT_LOCALE}/${theme}`,
    `${DEFAULT_LOCALE}/${fallbackTheme}`,
  ];

  const variant = preference.find((candidate) =>
    step.captured.includes(candidate),
  );

  return variant ? `${FLOW_MEDIA_BASE}/landing/${variant}/${step.file}` : null;
}
