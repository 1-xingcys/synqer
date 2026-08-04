import {
  LiffEntryAction,
  hasLoginCallbackParams,
  resolveLiffEntryAction,
  resolveLiffStateServerRedirect,
} from "@/components/providers/liffEntry";

const LIFF_ID = "2008737136-VvaKkvyd";
const ORIGIN = "https://jbro.synqer.club";

const base = {
  liffId: LIFF_ID,
  isLineUserAgent: true,
  arrivedFromLiff: false,
};

describe("hasLoginCallbackParams", () => {
  it("detects the authorization code flow", () => {
    expect(
      hasLoginCallbackParams(new URL(`${ORIGIN}/en?code=abc&state=xyz`)),
    ).toBe(true);
  });

  it("detects tokens carried in the fragment", () => {
    expect(
      hasLoginCallbackParams(new URL(`${ORIGIN}/en#access_token=abc`)),
    ).toBe(true);
    expect(hasLoginCallbackParams(new URL(`${ORIGIN}/en#id_token=abc`))).toBe(
      true,
    );
  });

  it("does not fire on a plain LIFF launch", () => {
    expect(
      hasLoginCallbackParams(new URL(`${ORIGIN}/en?liff.state=%2Fnew`)),
    ).toBe(false);
  });
});

describe("resolveLiffEntryAction — liff.state redirect", () => {
  it("prefixes the current locale onto a locale-less state path", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fnew`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/en/new",
      awaitLiffInit: false,
    });
  });

  it("keeps a state path that already carries a locale", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fzh-TW%2Fjoined%2Fabc`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/zh-TW/joined/abc",
      awaitLiffInit: false,
    });
  });

  it("does not mistake a lookalike segment for a locale prefix", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fenterprise`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/en/enterprise",
      awaitLiffInit: false,
    });
  });

  it("asks the caller to await liff.init() on a login callback", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=%2Fnew&code=abc&state=xyz`,
      }),
    ).toEqual({
      action: LiffEntryAction.RedirectToStatePath,
      targetPath: "/en/new",
      awaitLiffInit: true,
    });
  });

  it("continues when the state path points at the current page", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en/new?liff.state=%2Fnew`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("ignores a state value that is not a path", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en?liff.state=https%3A%2F%2Fevil.example.com`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });
});

describe("resolveLiffEntryAction — forwarding a plain LINE URL into LIFF", () => {
  it("forwards a plain in-app-browser URL to liff.line.me", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        url: `${ORIGIN}/en/joined/abc?tab=results`,
      }),
    ).toEqual({
      action: LiffEntryAction.ForwardToLiffEntry,
      entryUrl: `https://liff.line.me/${LIFF_ID}/en/joined/abc?tab=results`,
    });
  });

  it("does not forward once we are known to be inside a LIFF launch", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        arrivedFromLiff: true,
        url: `${ORIGIN}/en/new`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("does not forward outside LINE", () => {
    expect(
      resolveLiffEntryAction({
        ...base,
        isLineUserAgent: false,
        url: `${ORIGIN}/en/new`,
      }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("does not forward without a configured LIFF id", () => {
    expect(
      resolveLiffEntryAction({ ...base, liffId: "", url: `${ORIGIN}/en/new` }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });

  it("does not forward a login callback, which the SDK must consume here", () => {
    expect(
      resolveLiffEntryAction({ ...base, url: `${ORIGIN}/en/new?code=abc` }),
    ).toEqual({ action: LiffEntryAction.Continue });
  });
});

describe("resolveLiffStateServerRedirect", () => {
  it("resolves the same target as the client decision", () => {
    expect(
      resolveLiffStateServerRedirect({
        pathname: "/en",
        search: "?liff.state=%2Fnew",
      }),
    ).toBe("/en/new");
  });

  it("declines the root path, where the locale is not known yet", () => {
    expect(
      resolveLiffStateServerRedirect({
        pathname: "/",
        search: "?liff.state=%2Fnew",
      }),
    ).toBeNull();
  });

  it("declines a login callback so the client SDK can consume the code", () => {
    expect(
      resolveLiffStateServerRedirect({
        pathname: "/en",
        search: "?liff.state=%2Fnew&code=abc",
      }),
    ).toBeNull();
  });

  it("declines a URL without liff.state", () => {
    expect(
      resolveLiffStateServerRedirect({ pathname: "/en/new", search: "" }),
    ).toBeNull();
  });
});
