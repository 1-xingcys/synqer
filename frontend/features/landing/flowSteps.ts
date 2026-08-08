/**
 * The four steps of each way into the product, and the capture that shows it.
 *
 * The two flows are deliberately the same four steps: what changes between
 * them is only how the event travels — a LINE card, or a link you paste
 * anywhere. Keeping the step keys identical is what lets the tabs read as two
 * routes through one process rather than two products.
 */

export const FLOW_MODES = ["line", "web"] as const;

export type FlowMode = (typeof FLOW_MODES)[number];

/** Where the captures live, under `public/`. */
export const FLOW_MEDIA_DIR = "/landing";

export interface FlowStep {
  /** Also the translation key under `landing.flow.<mode>`. */
  key: string;
  /** Filename inside {@link FLOW_MEDIA_DIR}. */
  file: string;
  /**
   * Whether the file exists yet. While false the step renders a placeholder
   * holding the right amount of space, so dropping the capture in later does
   * not reflow the page.
   */
  ready: boolean;
}

export const FLOW_STEPS: Record<FlowMode, FlowStep[]> = {
  line: [
    { key: "create", file: "line-1-create.gif", ready: false },
    { key: "collect", file: "line-2-collect.gif", ready: false },
    { key: "inspect", file: "line-3-inspect.gif", ready: false },
    { key: "confirm", file: "line-4-confirm.gif", ready: false },
  ],
  web: [
    { key: "create", file: "web-1-create.gif", ready: false },
    { key: "collect", file: "web-2-collect.gif", ready: false },
    { key: "inspect", file: "web-3-inspect.gif", ready: false },
    { key: "confirm", file: "web-4-confirm.gif", ready: false },
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

export function flowMediaSrc(step: FlowStep): string {
  return `${FLOW_MEDIA_DIR}/${step.file}`;
}
