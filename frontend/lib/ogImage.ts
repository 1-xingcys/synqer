import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { siteUrl } from "@/lib/site";

/**
 * The share card each page hands to Open Graph and Twitter.
 *
 * The card is drawn by `app/og/[locale]/card.png` rather than baked into
 * artwork, so the two locales share one layout and a wording change is a change
 * to the message catalogue.
 */

/** What Open Graph, Twitter and LINE all expect of a large preview image. */
const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * The brand card, one rendering per locale.
 *
 * The `.png` on the end is load-bearing: middleware's matcher excludes any
 * path containing a dot, so the card is never handed to the locale middleware,
 * which would otherwise redirect a locale-less path somewhere else entirely.
 *
 * `alt` is passed in because the strings live in the `seo` namespace of the
 * message catalogues and this module has no translator of its own.
 *
 * Note for whoever adds a per-event card later: metadata merges *shallowly*,
 * so a page that sets `openGraph` replaces the layout's entire object —
 * `siteName`, `locale` and `url` included. Repeat them, or share them from
 * here.
 */
export function brandOgImage(locale: string, alt: string): OgImage {
  // A malformed URL segment should still get a card rather than a broken image.
  const drawing = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return {
    url: siteUrl(`/og/${drawing}/card.png`),
    ...OG_IMAGE_SIZE,
    alt,
  };
}
