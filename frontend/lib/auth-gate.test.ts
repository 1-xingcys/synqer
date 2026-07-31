import {
  isProtectedPath,
  matchesLineUserAgent,
  resolveLoginRedirect,
  splitLocale,
} from "@/lib/auth-gate";

const CHROME_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1";
const LINE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.1.0";

describe("splitLocale", () => {
  it("separates a locale prefix from the rest of the path", () => {
    expect(splitLocale("/zh-TW/new")).toEqual({
      locale: "zh-TW",
      path: "/new",
    });
    expect(splitLocale("/en/hosted/abc/settings")).toEqual({
      locale: "en",
      path: "/hosted/abc/settings",
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

describe("isProtectedPath", () => {
  it.each([
    "/new",
    "/zh-TW/new",
    "/en/new",
    "/zh-TW/new/success/abc",
    "/zh-TW/events",
    "/zh-TW/hosted/abc/participants",
    "/zh-TW/joined",
  ])("treats %s as protected", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each(["/", "/zh-TW", "/zh-TW/login", "/zh-TW/privacy", "/en/terms"])(
    "treats %s as public",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false);
    },
  );

  it("does not match a segment that merely starts with a protected name", () => {
    expect(isProtectedPath("/zh-TW/newsletter")).toBe(false);
  });
});

describe("matchesLineUserAgent", () => {
  it("detects the LINE in-app browser", () => {
    expect(matchesLineUserAgent(LINE_UA)).toBe(true);
  });

  it("does not match an ordinary mobile browser", () => {
    expect(matchesLineUserAgent(CHROME_UA)).toBe(false);
  });

  it("is safe on an empty user agent", () => {
    expect(matchesLineUserAgent("")).toBe(false);
  });
});

describe("resolveLoginRedirect", () => {
  it("sends a cookieless visitor on a protected path to /login", () => {
    expect(
      resolveLoginRedirect({
        pathname: "/zh-TW/new",
        hasSessionCookie: false,
        userAgent: CHROME_UA,
      }),
    ).toBe("/zh-TW/login?redirect=%2Fnew");
  });

  it("preserves the deep path in the redirect parameter", () => {
    expect(
      resolveLoginRedirect({
        pathname: "/en/hosted/abc/settings",
        hasSessionCookie: false,
        userAgent: CHROME_UA,
      }),
    ).toBe("/en/login?redirect=%2Fhosted%2Fabc%2Fsettings");
  });

  it("omits the locale prefix when the path has none", () => {
    expect(
      resolveLoginRedirect({
        pathname: "/new",
        hasSessionCookie: false,
        userAgent: CHROME_UA,
      }),
    ).toBe("/login?redirect=%2Fnew");
  });

  it("lets a request with a session cookie through", () => {
    expect(
      resolveLoginRedirect({
        pathname: "/zh-TW/new",
        hasSessionCookie: true,
        userAgent: CHROME_UA,
      }),
    ).toBeNull();
  });

  it("lets the LINE in-app browser through so LIFF can log the user in", () => {
    expect(
      resolveLoginRedirect({
        pathname: "/zh-TW/new",
        hasSessionCookie: false,
        userAgent: LINE_UA,
      }),
    ).toBeNull();
  });

  it("never touches public paths", () => {
    expect(
      resolveLoginRedirect({
        pathname: "/zh-TW/login",
        hasSessionCookie: false,
        userAgent: CHROME_UA,
      }),
    ).toBeNull();
    expect(
      resolveLoginRedirect({
        pathname: "/",
        hasSessionCookie: false,
        userAgent: CHROME_UA,
      }),
    ).toBeNull();
  });
});
