import { readFile } from "node:fs/promises";
import path from "node:path";

/** The family name the card refers to the face by. */
export const WORDMARK_FONT = "Geist";

let cached: Buffer | undefined;

export async function loadFont(): Promise<Buffer> {
  if (cached === undefined) {
    cached = await readFile(
      path.join(process.cwd(), "lib/seo/ogCard/fonts/Geist-Bold-synqer.ttf"),
    );
  }

  return cached;
}
