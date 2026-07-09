import { paginateEvents } from "./paginateEvents";

describe("paginateEvents", () => {
  const items = Array.from({ length: 23 }, (_, i) => i);

  it("returns the requested page slice", () => {
    const r = paginateEvents(items, 2, 10);
    expect(r.items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(r.totalPages).toBe(3);
    expect(r.totalItems).toBe(23);
  });

  it("handles an empty list", () => {
    const r = paginateEvents([], 1, 10);
    expect(r.items).toEqual([]);
    expect(r.totalPages).toBe(0);
    expect(r.totalItems).toBe(0);
  });
});
