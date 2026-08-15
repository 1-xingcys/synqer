import { readFile } from "node:fs/promises";
import path from "node:path";

/** The family name the card refers to the face by. */
export const WORDMARK_FONT = "Geist";

/**
 * The wordmark's face: Geist Bold, subset to the six glyphs of "Synqer".
 *
 * Satori draws with the one face `next/og` bundles — Noto Sans regular — and
 * answers a weight it has no face for by drawing regular rather than by
 * complaining. `fontWeight: 700` has therefore never done anything in these
 * cards. It did not show while the wordmark was a corner signature; it shows
 * immediately now that it is the whole card, so the card carries its own face.
 *
 * Subset because the card says one word and always will:
 *
 *     pyftsubset Geist-Bold.ttf --text="Synqer" \
 *       --output-file=Geist-Bold-synqer.ttf --no-hinting --desubroutinize \
 *       --layout-features='' --drop-tables+=GSUB,GPOS,GDEF
 *
 * 128 KB of face becomes 1.5 KB. Geist because `app/[locale]/layout.tsx`
 * already declares it as the site's typeface. See `fonts/OFL.txt`.
 *
 * Read off disk rather than fetched, and read once per process. Unlike the
 * brand card's illustration there is no network here to fail, and the only
 * caller is prerendered — so a file that cannot be read is a red build rather
 * than a preview that is quietly the wrong weight.
 */
let cached: Buffer | undefined;

export async function loadFont(): Promise<Buffer> {
  if (cached === undefined) {
    cached = await readFile(
      path.join(process.cwd(), "lib/seo/ogCard/fonts/Geist-Bold-synqer.ttf"),
    );
  }

  return cached;
}
