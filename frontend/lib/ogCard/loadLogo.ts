import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageDataUrl } from "@/lib/ogImage";

/**
 * The wordmark, inlined as a data URI.
 *
 * Read off disk rather than fetched over the network. Satori cannot report a
 * failed `<img src>` — a fetch that 404s takes the whole card down — and the
 * file is already sitting in `public/` beside the renderer, so there is no
 * reason to ask a web server for it and no request to fail.
 *
 * Read once per process. It is a build artefact and cannot change while the
 * server is up.
 *
 * @returns null when the file cannot be read or is not a format the renderer
 *   can decode, which the card answers by drawing the wordmark alone.
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
