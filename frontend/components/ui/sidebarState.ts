/**
 * Rules for deriving the sidebar's open/closed presentation.
 *
 * `null` means "the user has not toggled it manually yet". That state
 * deliberately never reads window -- the default appearance (collapsed on
 * mobile, expanded on desktop) is left entirely to Tailwind's lg: breakpoint,
 * so the first server and client render always agree: no hydration mismatch and
 * no flash of a wrong layout being corrected. Once the user hits the toggle,
 * the state becomes an explicit true / false.
 */
export type SidebarOpenState = boolean | null;

export interface SidebarPresentation {
  /** When collapsed, SidebarItem shows icons only */
  isCollapsed: boolean;
  /** The translucent mobile backdrop, only needed when actually expanded */
  showOverlay: boolean;
  visibilityClass: string;
  widthClass: string;
}

const VISIBLE = "translate-x-0 opacity-100 pointer-events-auto";

// When collapsed the panel slides fully off screen on mobile, while desktop
// keeps it visible through the lg: overrides.
const HIDDEN_ON_MOBILE_ONLY =
  "-translate-x-full opacity-0 pointer-events-none " +
  "lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto";

export function resolveSidebarPresentation(
  isOpen: SidebarOpenState,
): SidebarPresentation {
  return {
    // null does not count as collapsed: desktop should be expanded and mobile
    // is not visible at all, so both cases should show the labels
    isCollapsed: isOpen === false,
    showOverlay: isOpen === true,
    visibilityClass: isOpen === true ? VISIBLE : HIDDEN_ON_MOBILE_ONLY,
    widthClass: isOpen === false ? "lg:w-20" : "lg:w-64",
  };
}

/**
 * Which direction the toggle should go from the untouched state.
 *
 * Mobile defaults to collapsed, so it opens; desktop defaults to expanded, so
 * it collapses. Only called on user interaction, where reading the window width
 * is safe.
 */
export function nextSidebarOpenState(
  isOpen: SidebarOpenState,
  isDesktop: boolean,
): boolean {
  return isOpen === null ? !isDesktop : !isOpen;
}

/**
 * Whether to hide the sidebar from assistive technology.
 *
 * Desktop always stays in the accessibility tree; mobile only when expanded.
 * Before mount everything is treated as mobile, which is fine because screen
 * readers only read the tree after hydration anyway.
 */
export function isHiddenFromAssistiveTech(
  isOpen: SidebarOpenState,
  isDesktop: boolean,
): boolean {
  return !isDesktop && isOpen !== true;
}
