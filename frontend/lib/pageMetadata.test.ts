import { SITE_NAME, brandedTitle, pageIdentity } from "./pageMetadata";
import { SITE_URL } from "./site";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

const BASE = {
  shareTitle: "Synqer — the brand line",
  description: "The pitch.",
  ogImageAlt: "The card.",
};

describe("brandedTitle", () => {
  // title.template gives the tab "<name> | Synqer"; og:title has no template
  // mechanism, so the two only agree if the suffix is spelled the same way.
  it("matches the shape title.template produces", () => {
    expect(brandedTitle("Privacy Policy")).toBe(
      `Privacy Policy | ${SITE_NAME}`,
    );
  });
});

describe("pageIdentity", () => {
  // The bug this function exists for: with these declared once in the locale
  // layout, every page below inherited them and claimed to be the landing page.
  it("points a page's canonical URL at itself, not at the landing page", () => {
    const privacy = pageIdentity({
      locale: "zh-TW",
      path: "/privacy",
      ...BASE,
    });

    expect(privacy.alternates?.canonical).toBe("/zh-TW/privacy");
    expect(privacy.openGraph?.url).toBe(`${SITE_URL}/zh-TW/privacy`);
  });

  it("offers each locale's own spelling of that same page", () => {
    const { alternates } = pageIdentity({
      locale: "en",
      path: "/terms",
      ...BASE,
    });

    for (const locale of LOCALES) {
      expect(alternates?.languages?.[locale]).toBe(`/${locale}/terms`);
    }
    expect(alternates?.languages?.["x-default"]).toBe(
      `/${DEFAULT_LOCALE}/terms`,
    );
  });

  it("treats the landing page as the root of its locale", () => {
    const landing = pageIdentity({ locale: "zh-TW", ...BASE });

    expect(landing.alternates?.canonical).toBe("/zh-TW");
    expect(landing.openGraph?.url).toBe(`${SITE_URL}/zh-TW`);
  });

  it("shares the title it is given, on both networks", () => {
    const { openGraph, twitter } = pageIdentity({
      locale: "en",
      path: "/privacy",
      ...BASE,
      shareTitle: brandedTitle("Privacy Policy"),
    });

    expect(openGraph?.title).toBe(`Privacy Policy | ${SITE_NAME}`);
    expect(twitter?.title).toBe(`Privacy Policy | ${SITE_NAME}`);
  });

  // A page's own description has to reach all three, or the search result and
  // the share preview describe different pages.
  it("describes the page the same way everywhere", () => {
    const page = pageIdentity({
      locale: "zh-TW",
      path: "/terms",
      ...BASE,
      description: "使用條款",
    });

    expect(page.description).toBe("使用條款");
    expect(page.openGraph?.description).toBe("使用條款");
    expect(page.twitter?.description).toBe("使用條款");
  });

  // Metadata merges shallowly: a page that returns a partial openGraph drops
  // whatever the layout declared, share card included.
  it("returns the share block complete, so a page can replace it wholesale", () => {
    const { openGraph } = pageIdentity({
      locale: "zh-TW",
      path: "/terms",
      ...BASE,
    });

    expect(openGraph).toMatchObject({
      type: "website",
      siteName: SITE_NAME,
      locale: "zh_TW",
    });
    expect(openGraph?.images).toHaveLength(1);
  });

  it("states no title of its own, leaving that to the page", () => {
    expect(pageIdentity({ locale: "en", ...BASE }).title).toBeUndefined();
  });
});
