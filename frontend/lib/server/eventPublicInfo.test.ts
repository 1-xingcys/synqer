import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  fetchEventPublicInfo,
  resolveApiUrl,
} from "@/lib/server/eventPublicInfo";
import { SITE_URL } from "@/lib/site";

const ORIGINAL_API = process.env.NEXT_PUBLIC_API;

/** What `GET /events/:id/public` answers, trimmed to what the metadata reads. */
const PUBLIC_INFO = {
  isDeleted: false,
  id: "evt_1",
  type: "ONE_TIME",
  title: "Team offsite",
  description: null,
  schedule: {
    kind: "ONE_TIME",
    startDate: "2026-07-30T00:00:00.000Z",
    endDate: "2026-08-02T00:00:00.000Z",
    startMinuteOfDay: 540,
    endMinuteOfDay: 1080,
    slotDurationMin: 30,
  },
  timeZone: "Asia/Taipei",
  votingDeadline: "2026-07-28T23:59:00.000Z",
  confirmedSlotIds: [],
  confirmedSelections: [],
  status: "VOTING",
  capabilities: {
    supportsCompletion: false,
    supportsCalendarConflict: false,
    supportsAddToCalendar: false,
  },
  expectedParticipantCount: 0,
};

function respondWith(body: unknown, ok = true) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok, json: () => Promise.resolve(body) }),
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API = "/api";
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API = ORIGINAL_API;
  jest.restoreAllMocks();
});

describe("resolveApiUrl", () => {
  // The bug this exists for: "/api" is a perfectly good base in the browser
  // and throws outright in a server fetch.
  it("resolves a site-relative API base against the site origin", () => {
    expect(resolveApiUrl("/events/evt_1/public")).toBe(
      `${SITE_URL}/api/events/evt_1/public`,
    );
  });

  it("leaves an API base that is already absolute alone", () => {
    process.env.NEXT_PUBLIC_API = "http://localhost:8080";

    expect(resolveApiUrl("/events/evt_1/public")).toBe(
      "http://localhost:8080/events/evt_1/public",
    );
  });

  it("refuses to guess when no API base is configured", () => {
    process.env.NEXT_PUBLIC_API = "";

    expect(() => resolveApiUrl("/events/evt_1/public")).toThrow(
      "NEXT_PUBLIC_API is not set",
    );
  });
});

describe("fetchEventPublicInfo", () => {
  it("normalizes the response so its days and deadline are read as naive", async () => {
    respondWith(PUBLIC_INFO);

    const event = await fetchEventPublicInfo("evt_1");

    expect(event?.title).toBe("Team offsite");
    expect(event?.schedule).toMatchObject({
      kind: "ONE_TIME",
      startDate: "2026-07-30",
      endDate: "2026-08-02",
    });
    expect(event?.votingDeadline).toBe("2026-07-28T23:59:00.000Z");
  });

  // Each of these would otherwise reach generateMetadata as a throw, and a
  // page that cannot be named still has to render.
  it("returns null rather than throwing when the API refuses", async () => {
    respondWith({ message: "Not found" }, false);

    await expect(fetchEventPublicInfo("evt_missing")).resolves.toBeNull();
  });

  it("returns null rather than throwing when the API is unreachable", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("ECONNREFUSED")),
    ) as unknown as typeof fetch;

    await expect(fetchEventPublicInfo("evt_unreachable")).resolves.toBeNull();
  });

  it("returns null rather than throwing on a malformed schedule", async () => {
    respondWith({
      ...PUBLIC_INFO,
      schedule: { ...PUBLIC_INFO.schedule, startDate: undefined },
    });

    await expect(fetchEventPublicInfo("evt_malformed")).resolves.toBeNull();
  });

  // A deleted event still answers, so that the page can say it is gone.
  it("declines to name a deleted event", async () => {
    respondWith({ ...PUBLIC_INFO, isDeleted: true });

    await expect(fetchEventPublicInfo("evt_deleted")).resolves.toBeNull();
  });
});
