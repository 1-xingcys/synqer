import {
  isProtectedPath,
  matchesLineUserAgent,
  resolveLoginRedirect,
  resolveSignedInRedirect,
  validateRedirectPath,
} from "@/lib/auth-gate";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";

const CHROME_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1";
const LINE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/14.1.0";

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

describe("validateRedirectPath", () => {
  it("passes a same-origin path through untouched", () => {
    expect(validateRedirectPath("/hosted/abc/settings")).toBe(
      "/hosted/abc/settings",
    );
    expect(validateRedirectPath("/events/voting?tab=1")).toBe(
      "/events/voting?tab=1",
    );
  });

  it("falls back to the default when nothing was requested", () => {
    expect(validateRedirectPath(null)).toBe(DEFAULT_OVERVIEW_PATH);
    expect(validateRedirectPath("")).toBe(DEFAULT_OVERVIEW_PATH);
  });

  it("rejects a protocol-relative URL", () => {
    expect(validateRedirectPath("//evil.example.com")).toBe(
      DEFAULT_OVERVIEW_PATH,
    );
  });

  it("rejects anything that is not a rooted path", () => {
    expect(validateRedirectPath("https://evil.example.com")).toBe(
      DEFAULT_OVERVIEW_PATH,
    );
    expect(validateRedirectPath("javascript:alert(1)")).toBe(
      DEFAULT_OVERVIEW_PATH,
    );
    expect(validateRedirectPath("data:text/html,x")).toBe(
      DEFAULT_OVERVIEW_PATH,
    );
    expect(validateRedirectPath("events/voting")).toBe(DEFAULT_OVERVIEW_PATH);
  });
});

describe("resolveSignedInRedirect", () => {
  it("sends a visitor who already has a session to the requested path", () => {
    expect(
      resolveSignedInRedirect({
        hasSessionCookie: true,
        redirect: "/hosted/abc/settings",
        sessionExpired: false,
      }),
    ).toBe("/hosted/abc/settings");
  });

  it("defaults the destination when no redirect was requested", () => {
    expect(
      resolveSignedInRedirect({
        hasSessionCookie: true,
        redirect: null,
        sessionExpired: false,
      }),
    ).toBe(DEFAULT_OVERVIEW_PATH);
  });

  it("renders the login page when there is no session cookie", () => {
    expect(
      resolveSignedInRedirect({
        hasSessionCookie: false,
        redirect: "/events/voting",
        sessionExpired: false,
      }),
    ).toBeNull();
  });

  /**
   * ProtectedLayout sets the flag after /auth/me rejects a cookie it still
   * holds. Without this branch the two would redirect at each other forever.
   */
  it("renders the login page when the session it holds is known to be stale", () => {
    expect(
      resolveSignedInRedirect({
        hasSessionCookie: true,
        redirect: "/events/voting",
        sessionExpired: true,
      }),
    ).toBeNull();
  });

  it("refuses to bounce a signed-in visitor off-origin", () => {
    expect(
      resolveSignedInRedirect({
        hasSessionCookie: true,
        redirect: "//evil.example.com",
        sessionExpired: false,
      }),
    ).toBe(DEFAULT_OVERVIEW_PATH);
  });
});
