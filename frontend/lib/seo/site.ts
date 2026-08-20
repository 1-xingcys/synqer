/**
 * The canonical public origin.
 */
export const SITE_URL = "https://synqer.club";

/** An absolute URL for a site-root-relative path. */
export function siteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
