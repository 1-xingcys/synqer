import { SITE_URL, siteUrl } from "./site";

describe("siteUrl", () => {
  it("returns the origin itself for the root path", () => {
    expect(siteUrl("/")).toBe(`${SITE_URL}/`);
  });

  it("builds absolute URLs for site-root-relative paths", () => {
    expect(siteUrl("/zh-TW")).toBe(`${SITE_URL}/zh-TW`);
    expect(siteUrl("/zh-TW/privacy")).toBe(`${SITE_URL}/zh-TW/privacy`);
  });

  // The two would otherwise concatenate into "//sitemap.xml", which resolves
  // to a different host entirely.
  it("never doubles the slash between origin and path", () => {
    expect(siteUrl("/sitemap.xml")).not.toContain("//sitemap.xml");
  });
});

describe("SITE_URL", () => {
  it("carries no trailing slash", () => {
    expect(SITE_URL).not.toMatch(/\/$/);
  });
});
