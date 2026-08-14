import { brandOgImage } from "./ogImage";
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
