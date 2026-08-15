import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { siteUrl } from "@/lib/seo/site";

/**
 * The share card each page hands to Open Graph and Twitter.
 *
 * The card is half drawn and half photographed: `app/og/[locale]/card.png`
 * draws the copy and the background with `next/og`, and composites an
 * illustration fetched from the assets CDN into the right half. So the words
 * follow the message catalogues — one layout, two locales, no second copy of
 * the artwork — while the illustration stays a re-upload rather than a deploy.
 *
 * The assets origin is a constant rather than an environment variable. The
 * public origin needs one — it differs per environment, and two spellings of a
 * page would split its ranking — but one CDN serves the artwork to all of them.
 */

const ASSETS_ORIGIN = "https://assets.synqer.club";

/** What Open Graph, Twitter and LINE all expect of a large preview image. */
const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** The drawing composited into the right half of every brand card. */
export const OG_ILLUSTRATION_URL = `${ASSETS_ORIGIN}/og/illustration.png`;

/**
 * The formats the card renderer can actually decode, by their magic number.
 *
 * WebP, AVIF and SVG are deliberately absent: the renderer has no decoder for
 * them, and it reports that by drawing nothing rather than by failing.
 */
const IMAGE_SIGNATURES: ReadonlyArray<{ magic: number[]; type: string }> = [
  {
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    type: "image/png",
  },
  { magic: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  { magic: [0x47, 0x49, 0x46, 0x38], type: "image/gif" },
];

/**
 * Inline image bytes as a data URI, typed by what they *are*.
 *
 * Never by what the server said they were. A JPEG uploaded under a `.png` name
 * is served as `image/png` — object stores guess the type from the extension —
 * and a data URI built on that claim decodes to nothing at all. The renderer
 * does not raise; it simply leaves the space blank, so the mislabelling only
 * ever surfaces as a card with a hole in it.
 *
 * @returns null when the bytes are not a format the renderer can draw, which
 *   the caller answers with the fallback motif.
 */
export function imageDataUrl(bytes: Uint8Array): string | null {
  const signature = IMAGE_SIGNATURES.find(({ magic }) =>
    magic.every((byte, index) => bytes[index] === byte),
  );

  if (!signature) return null;

  return `data:${signature.type};base64,${Buffer.from(bytes).toString("base64")}`;
}

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

/**
 * The brand mark, previewed by every page about an event.
 *
 * One URL for all of them, and for both locales. Each of those pages used to
 * point at a card drawn for that event — its name, its candidate dates, its
 * deadline — which said in a picture what the `og:title` and `og:description`
 * beside it already say in words. What is left is the mark, and a mark is the
 * same whichever event the link is about, so it takes neither a locale nor an
 * event id.
 */
export function markOgImage(alt: string): OgImage {
  return {
    url: siteUrl("/og/mark.png"),
    ...OG_IMAGE_SIZE,
    alt,
  };
}
