import { isLocale, splitLocale } from "@/i18n/locales";

describe("isLocale", () => {
  it("accepts a supported locale", () => {
    expect(isLocale("zh-TW")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isLocale("ja")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("splitLocale", () => {
  it("separates a locale prefix from the rest of the path", () => {
    expect(splitLocale("/zh-TW/new")).toEqual({
      locale: "zh-TW",
      path: "/new",
    });
    expect(splitLocale("/en/events/abc/settings")).toEqual({
      locale: "en",
      path: "/events/abc/settings",
    });
  });

  it("treats a bare locale as the root path", () => {
    expect(splitLocale("/zh-TW")).toEqual({ locale: "zh-TW", path: "/" });
  });

  it("leaves an unprefixed path untouched", () => {
    expect(splitLocale("/new")).toEqual({ locale: null, path: "/new" });
    expect(splitLocale("/")).toEqual({ locale: null, path: "/" });
  });

  it("does not treat a lookalike segment as a locale", () => {
    expect(splitLocale("/zh-TWx/new")).toEqual({
      locale: null,
      path: "/zh-TWx/new",
    });
  });
});
