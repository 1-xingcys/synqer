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
    {
      key: "create",
      file: "line-step-1.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
    // Only step 1 has been shot in dark so far; the rest fall back to light.
    {
      key: "collect",
      file: "line-step-2.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
    {
      key: "inspect",
      file: "line-step-3.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
    {
      key: "confirm",
      file: "line-step-4.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
  ],
  // The web flow has only been shot in dark, in both languages, so a reader on
  // a light page is served the dark capture in their own language rather than
  // a light one in the other — see flowMediaSrc on why locale wins.
  web: [
    {
      key: "create",
      file: "web-step-1.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
    {
      key: "collect",
      file: "web-step-2.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
    {
      key: "inspect",
      file: "web-step-3.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
    {
      key: "confirm",
      file: "web-step-4.png",
      captured: ["en/light", "en/dark", "zh-TW/light", "zh-TW/dark"],
    },
  ],
};

/** How wide the phone itself should read on the page. The knob worth turning. */
const DEVICE_WIDTH_REM = 16;

/**
 * The share of a capture's width taken up by the phone body.
 *
 * A capture is a device mockup standing on a transparent canvas, and it brings
 * its own drop shadow — so the canvas is deliberately wider than the phone.
 * Measured from the alpha channel of `line-step-1.png`: the opaque body spans
 * 719 of 1080 px, centred. Sizing the frame by the canvas instead would mean
 * tuning a number a third larger than anything visible on screen.
 */
const DEVICE_SHARE = 0.666;

/**
 * The share of a capture's height that is fully transparent, at each end.
 *
 * Measured the same way: anything at all is drawn between y=146 and y=1802 of
 * 1920, so 6.85% above and below is empty. Left in the flow it reads as
 * layout — with the frame at its full size that is 47px of nothing at each
 * end, turning the 64px gap the rows are spaced by into a 158px one, and four
 * steps stop looking like a sequence.
 */
const VERTICAL_BLEED = 0.0685;

/**
 * The shape every capture is expected in.
 *
 * Both flows are shot on a phone — the web route is reached from a phone
 * browser as often as from a desktop — so one frame serves both and there is
 * nothing left to vary per mode. The capture is held narrower than the column
 * allows because height is what breaks the pairing with the text beside it: at
 * the full column width, 9:16 makes a row several times taller than its two
 * lines of copy and the pair stops reading as one step.
 */
export const FLOW_MEDIA = {
  aspect: "9 / 16",
  /** The whole canvas, scaled so the phone inside it lands at DEVICE_WIDTH_REM. */
  maxWidth: `${(DEVICE_WIDTH_REM / DEVICE_SHARE).toFixed(2)}rem`,
  /**
   * Negative block margin that takes the empty band back out of the flow.
   *
   * Expressed against width because that is what a percentage margin resolves
   * against — vertical or not — which is also what makes it right on a narrow
   * screen, where the frame is smaller than `maxWidth` and the band with it.
   */
  bleed: `-${(VERTICAL_BLEED * (16 / 9) * 100).toFixed(2)}%`,
  /** The same band as an inset, to sit the placeholder where the phone lands. */
  bleedInset: `${(VERTICAL_BLEED * 100).toFixed(2)}%`,
  pixels: "1080 × 1920",
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
