import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageDataUrl } from "@/lib/seo/ogImage";

/**
 * The wordmark, inlined as a data URI.
 *
 * @returns null when the file cannot be read or is not a format the renderer
 *   can decode. What that is worth answering with is the caller's to decide:
 *   the brand mark is prerendered and half of it is the logo, so it raises.
 */
let cached: string | null | undefined;

export async function loadLogo(): Promise<string | null> {
  if (cached !== undefined) return cached;

  try {
    const bytes = await readFile(path.join(process.cwd(), "public/synqer.png"));
    cached = imageDataUrl(new Uint8Array(bytes));

    if (!cached) {
      console.warn("OG card logo: unsupported format, drawing the word alone");
    }
  } catch (error) {
    console.warn("OG card logo: unreadable, drawing the word alone", error);
    cached = null;
  }

  return cached;
}
