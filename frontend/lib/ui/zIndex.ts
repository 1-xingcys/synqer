/**
 * App layer system (Tailwind z-index class tokens)
 *
 * Keep values centralized to avoid scattered magic numbers and layering bugs.
 */
export const Z_INDEX = {
  NAV_STICKY: "z-40",
  GRID_BASE: "z-50",
  DROPDOWN_OVER_GRID: "z-[110]",
  MODAL_BACKDROP: "z-[120]",
  MODAL_CONTENT: "z-[130]",
  SIDEBAR_BACKDROP: "z-[300]",
  SIDEBAR_PANEL: "z-[310]",
} as const;
