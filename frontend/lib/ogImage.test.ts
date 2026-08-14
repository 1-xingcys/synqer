import { OG_ILLUSTRATION_URL, brandOgImage, imageDataUrl } from "./ogImage";
import { SITE_URL } from "./site";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

describe("brandOgImage", () => {
  it("gives every locale its own rendering", () => {
    const urls = LOCALES.map((locale) => brandOgImage(locale, "alt").url);

    expect(new Set(urls).size).toBe(LOCALES.length);
    for (const locale of LOCALES) {
      expect(brandOgImage(locale, "alt").url).toBe(
        `${SITE_URL}/og/${locale}/card.png`,
      );
    }
  });

  // og:image is one of the fields a relative URL is never valid in.
  it("returns an absolute URL", () => {
    expect(brandOgImage("en", "alt").url).toMatch(/^https:\/\//);
  });

  // Middleware's matcher skips paths containing a dot. Without the extension
  // the locale middleware would redirect the card away from its own route.
  it("ends in an extension, so middleware never sees it", () => {
    expect(brandOgImage("en", "alt").url).toMatch(/\.png$/);
  });

  it("falls back to the default locale's card for an unknown locale", () => {
    expect(brandOgImage("de", "alt").url).toBe(
      brandOgImage(DEFAULT_LOCALE, "alt").url,
    );
  });

  it("reports the size crawlers are told to expect", () => {
    expect(brandOgImage("en", "alt")).toMatchObject({
      width: 1200,
      height: 630,
    });
  });

  it("carries the alt text it is handed", () => {
    expect(brandOgImage("en", "Synqer — vote together").alt).toBe(
      "Synqer — vote together",
    );
  });
});

describe("imageDataUrl", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const gif = Uint8Array.from([...Buffer.from("GIF89a"), 0x00, 0x00]);
  const webp = Uint8Array.from([
    ...Buffer.from("RIFF"),
    0,
    0,
    0,
    0,
    ...Buffer.from("WEBP"),
  ]);

  it("labels each format from its magic number", () => {
    expect(imageDataUrl(png)).toMatch(/^data:image\/png;base64,/);
    expect(imageDataUrl(jpeg)).toMatch(/^data:image\/jpeg;base64,/);
    expect(imageDataUrl(gif)).toMatch(/^data:image\/gif;base64,/);
  });

  // The bug this function exists for: a JPEG uploaded as "illustration.png" is
  // served as image/png by the CDN, which guesses from the extension. Trusting
  // that header produced a data URI claiming PNG over JPEG bytes, and the
  // renderer drew nothing at all rather than failing.
  it("ignores what the file was named and reads the bytes", () => {
    expect(imageDataUrl(jpeg)).not.toContain("image/png");
  });

  // The renderer has no decoder for these, and a card that silently loses its
  // illustration is worse than one that visibly falls back.
  it("rejects formats the renderer cannot decode", () => {
    expect(imageDataUrl(webp)).toBeNull();
  });

  it("rejects anything that is not an image at all", () => {
    expect(imageDataUrl(Uint8Array.from(Buffer.from("<!DOCTYPE html>")))).toBe(
      null,
    );
    expect(imageDataUrl(Uint8Array.from([]))).toBeNull();
  });
});

describe("OG_ILLUSTRATION_URL", () => {
  // The card is drawn on our own origin; only the illustration comes from the
  // CDN, and it is fetched server-side rather than linked from the metadata.
  it("points at the assets CDN, not at the site", () => {
    expect(OG_ILLUSTRATION_URL).toMatch(/^https:\/\/assets\.synqer\.club\//);
    expect(OG_ILLUSTRATION_URL).not.toContain(SITE_URL);
  });
});
