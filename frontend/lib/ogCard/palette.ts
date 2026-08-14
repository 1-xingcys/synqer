/**
 * The landing page's palette, which every share card belongs to.
 *
 * Zinc on white, with the hero headline's own blue gradient as the one accent.
 * The cards used to be navy, which matched nothing the visitor would find
 * after clicking one.
 */
export const PALETTE = {
  // The brand blue washed across the surface rather than confined to the
  // accent. Held at very low saturation: it has to read as tinted paper behind
  // near-black text, not as a coloured panel.
  surface: "linear-gradient(150deg, #ffffff 0%, #eef3fc 52%, #d9e5f7 100%)",
  heading: "#18181b",
  body: "#52525b",
  quiet: "#a1a1aa",
  // Zinc 200 rather than the 100 the grid uses on screen. The surface fades to
  // #f4f4f5 on the side the heatmap sits on, so a lighter empty cell dissolves
  // into it and leaves the grid full of holes.
  emptyCell: "#e4e4e7",
} as const;

/** The results heatmap's own emerald ramp, at the five steps it uses. */
export const RAMP = ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981"];

/**
 * The hero headline's gradient, as a band rather than as text.
 *
 * On the landing page it is painted onto the second line of the headline
 * through `background-clip: text`, which Satori supports too unevenly to rely
 * on. Drawn as a rule above the title it reads as the same accent without
 * depending on that.
 */
export const BRAND_ACCENT = "linear-gradient(to right, #6780c7, #78b0e0)";

/** The results view's own accent, from the top of the heatmap ramp. */
export const RESULTS_ACCENT = "linear-gradient(to right, #34d399, #10b981)";

/** What Open Graph, Twitter and LINE all expect of a large preview image. */
export const OG_CARD_SIZE = { width: 1200, height: 630 } as const;
