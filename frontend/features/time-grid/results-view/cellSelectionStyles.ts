/**
 * The highlight a results cell carries on top of its heatmap colour, once the
 * host has picked that slot as event time.
 *
 * Each state pairs four class strings that have to stay consistent with each
 * other; keeping them in one table is what stops a cell from picking up, say,
 * a dashed border in the draft colour but the committed fill.
 */
export type CellSelectionState =
  | "none"
  | "committed"
  | "staged-add"
  | "staged-remove";

export type HighlightedCellSelectionState = Exclude<CellSelectionState, "none">;

interface CellSelectionStyle {
  /** Border colour, applied per edge along the outline of a contiguous block. */
  border: string;
  /** Dashed for a draft, solid for what is already committed. */
  borderStyle: string;
  /** Tint laid over the heatmap colour. */
  fill: string;
  /** Vote-count colour, replacing the heatmap's own text colour. */
  text: string;
}

export const CELL_SELECTION_STYLES: Record<
  HighlightedCellSelectionState,
  CellSelectionStyle
> = {
  committed: {
    border: "border-blue-500 dark:border-blue-400",
    borderStyle: "",
    fill: "bg-blue-100/35 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
  },
  "staged-add": {
    border: "border-orange-500 dark:border-orange-400",
    borderStyle: "border-dashed",
    fill: "bg-orange-100/30 dark:bg-orange-900/15",
    text: "text-orange-700 dark:text-orange-300",
  },
  "staged-remove": {
    border: "border-rose-300 dark:border-rose-700",
    borderStyle: "border-dashed",
    fill: "bg-rose-100/70 dark:bg-rose-900/10",
    text: "text-rose-700 dark:text-rose-300",
  },
};
