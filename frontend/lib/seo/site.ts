/**
 * The canonical public origin.
 *
 * Canonical URLs, hreflang alternates, the sitemap and the share card all have
 * to be absolute, and all four have to agree — two spellings of the same page
 * split its ranking between them. So the origin is stated once, here.
 */

const DEFAULT_SITE_URL = "https://synqer.club";

/** No trailing slash, so callers can concatenate without doubling it. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");

/** An absolute URL for a site-root-relative path. */
export function siteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
