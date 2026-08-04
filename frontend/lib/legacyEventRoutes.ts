import { splitLocale } from "@/i18n/locales";
import {
  DEFAULT_OVERVIEW_PATH,
  eventDetailPath,
  eventOverviewPath,
  type DetailTab,
  type OverviewStatus,
} from "@/lib/eventRoutes";

/**
 * Retirement shim for the /hosted and /joined routes.
 *
 * Both trees were replaced by the unified /events routes, but links to them
 * live on in LINE messages we cannot edit, so the paths still have to resolve.
 * The route files are gone — middleware answers instead — which means every
 * path under these prefixes must get an answer here. Anything unrecognised
 * lands on the event overview rather than falling through to a 404.
 *
 * Delete this file, its test and the middleware branch together once the old
 * links are no longer worth supporting.
 */

/** First path segment of each retired route tree. */
const LEGACY_SEGMENTS = ["hosted", "joined"];

const OVERVIEW_STATUSES: readonly string[] = [
  "voting",
  "voting-ended",
  "confirmed",
  "completed",
] satisfies readonly OverviewStatus[];

/**
 * Tabs that existed under the old detail routes and still exist today.
 * "status" is deliberately absent: it was the joined-side overview and now maps
 * to the overview tab, which is also the fallback for anything unrecognised.
 */
const DETAIL_TABS: readonly string[] = [
  "vote",
  "results",
  "participants",
  "settings",
] satisfies readonly DetailTab[];

function isOverviewStatus(segment: string): segment is OverviewStatus {
  return OVERVIEW_STATUSES.includes(segment);
}

function isDetailTab(segment: string): segment is DetailTab {
  return DETAIL_TABS.includes(segment);
}

/**
 * Map a retired /hosted or /joined path onto its unified /events equivalent.
 *
 * The locale prefix of the incoming path is preserved so the visitor is not
 * bounced a second time by the next-intl middleware.
 *
 * @returns the redirect target, or null when the path is not a retired one.
 */
export function resolveLegacyEventRedirect(pathname: string): string | null {
  const { locale, path } = splitLocale(pathname);
  const [prefix, second, third] = path.split("/").filter(Boolean);

  if (!prefix || !LEGACY_SEGMENTS.includes(prefix)) {
    return null;
  }

  const withLocale = (target: string) =>
    locale ? `/${locale}${target}` : target;

  // "/hosted" and "/joined" were both list roots.
  if (!second) {
    return withLocale(DEFAULT_OVERVIEW_PATH);
  }

  // The list tabs were static routes, so they won the match against [eventId].
  if (isOverviewStatus(second)) {
    return withLocale(eventOverviewPath(second));
  }

  return withLocale(
    isDetailTab(third)
      ? eventDetailPath(second, third)
      : eventDetailPath(second),
  );
}
