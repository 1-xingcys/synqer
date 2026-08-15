import { isEventHost } from "./eventHost";

describe("isEventHost", () => {
  it("returns true when ids match across string/number", () => {
    expect(isEventHost(42, "42")).toBe(true);
  });
  it("returns false when ids differ", () => {
    expect(isEventHost("1", "2")).toBe(false);
  });
  it("returns false when either id is missing", () => {
    expect(isEventHost(undefined, "1")).toBe(false);
    expect(isEventHost("1", null)).toBe(false);
  });
});
