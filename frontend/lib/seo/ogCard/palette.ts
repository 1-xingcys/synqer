/** The landing page's palette, which every share card belongs to. */
export const PALETTE = {
  surface: "linear-gradient(150deg, #ffffff 0%, #eef3fc 52%, #d9e5f7 100%)",
  heading: "#18181b",
  body: "#52525b",
  quiet: "#a1a1aa",
  emptyCell: "#e4e4e7",
} as const;

/** The results heatmap's own emerald ramp, at the five steps it uses. */
export const RAMP = ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981"];

/** The hero headline's gradient, as a band rather than as text. */
export const BRAND_ACCENT = "linear-gradient(to right, #6780c7, #78b0e0)";

/** The results view's own accent, from the top of the heatmap ramp. */
export const RESULTS_ACCENT = "linear-gradient(to right, #34d399, #10b981)";

/** What Open Graph, Twitter and LINE all expect of a large preview image. */
export const OG_CARD_SIZE = { width: 1200, height: 630 } as const;
