import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { siteUrl } from "@/lib/seo/site";

/**
 * The share card each page hands to Open Graph and Twitter.
 */

const ASSETS_ORIGIN = "https://assets.synqer.club";

/** What Open Graph, Twitter and LINE all expect of a large preview image. */
const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** The drawing composited into the right half of every brand card. */
export const OG_ILLUSTRATION_URL = `${ASSETS_ORIGIN}/og/illustration.png`;

/** The formats the card renderer can actually decode, by their magic number. */
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

/** The brand card, one rendering per locale. */
export function brandOgImage(locale: string, alt: string): OgImage {
  // A malformed URL segment should still get a card rather than a broken image.
  const drawing = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return {
    url: siteUrl(`/og/${drawing}/card.png`),
    ...OG_IMAGE_SIZE,
    alt,
  };
}

/** The brand mark, previewed by every page about an event. */
export function markOgImage(alt: string): OgImage {
  return {
    url: siteUrl("/og/mark.png"),
    ...OG_IMAGE_SIZE,
    alt,
  };
}
