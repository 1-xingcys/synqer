import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/seo/ogCard/BrandMark";
import { loadFont, WORDMARK_FONT } from "@/lib/seo/ogCard/loadFont";
import { loadLogo } from "@/lib/seo/ogCard/loadLogo";
import { OG_CARD_SIZE } from "@/lib/seo/ogCard/palette";

/**
 * The share card for every page about an event.
 *
 * One card, not one per event and not one per locale: it draws the brand and
 * nothing else, so there is nothing on it for an event or a language to change.
 * The cards it replaced were drawn per request, because there is no finite list
 * of events to prerender — this one is a build artefact, which is what lets the
 * whole fallback path behind those cards go away. A build artefact cannot fail
 * while a crawler waits.
 *
 * A route handler rather than an `opengraph-image.tsx`, for the same reason the
 * brand card is one: file-based metadata outranks `generateMetadata`, and the
 * `openGraph.images` each page sets would never reach the `<head>`.
 *
 * The directory is literally named `mark.png` so the URL ends in an extension.
 * Middleware's matcher skips any path containing a dot, which keeps the locale
 * middleware from redirecting this away from itself. One segment under `/og`,
 * where the brand card is two, so the two routes cannot be confused for each
 * other.
 */

export const size = OG_CARD_SIZE;

export const dynamic = "force-static";

export async function GET() {
  const [logo, font] = await Promise.all([loadLogo(), loadFont()]);

  if (!logo) {
    // Half the card. Prerendered, so this is a red build rather than a preview
    // that ships with a hole where the mark should be.
    throw new Error("OG brand mark: the logo could not be read");
  }

  return new ImageResponse(<BrandMark logo={logo} />, {
    ...size,
    fonts: [{ name: WORDMARK_FONT, data: font, weight: 700, style: "normal" }],
  });
}
