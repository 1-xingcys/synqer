// The name must start with "mock" — jest.mock factories may not reference any
// other out-of-scope variable.
const mockLiff = {
  init: jest.fn().mockResolvedValue(undefined),
  isInClient: jest.fn().mockReturnValue(true),
  isLoggedIn: jest.fn().mockReturnValue(true),
  getProfile: jest.fn().mockResolvedValue({
    userId: "U1",
    displayName: "Tester",
    pictureUrl: "https://example.com/a.png",
  }),
};

jest.mock("@line/liff", () => ({ __esModule: true, default: mockLiff }));

describe("initializeLiff", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_LINE_LIFF_ID = "test-liff-id";
  });

  it("runs liff.init() once for concurrent callers", async () => {
    const { initializeLiff } = await import("@/lib/line/liff");

    const states = await Promise.all([
      initializeLiff(),
      initializeLiff(),
      initializeLiff(),
    ]);

    expect(mockLiff.init).toHaveBeenCalledTimes(1);
    states.forEach((state) => expect(state.isInitialized).toBe(true));
  });

  it("runs liff.init() once for sequential callers", async () => {
    const { initializeLiff } = await import("@/lib/line/liff");

    await initializeLiff();
    await initializeLiff();

    expect(mockLiff.init).toHaveBeenCalledTimes(1);
  });

  it("fetches the profile once per document", async () => {
    const { getLiffProfile } = await import("@/lib/line/liff");

    const profiles = await Promise.all([getLiffProfile(), getLiffProfile()]);

    expect(mockLiff.getProfile).toHaveBeenCalledTimes(1);
    expect(profiles[0]).toEqual(profiles[1]);
    expect(profiles[0]?.displayName).toBe("Tester");
  });
});
