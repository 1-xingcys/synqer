import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  ApiError,
  apiFetch,
  apiFetchJson,
  apiFetchVoid,
} from "@/lib/apiClient";

const BASE_URL = "https://api.test";

type MockResponseInit = {
  ok?: boolean;
  status?: number;
  contentType?: string | null;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

function mockResponse({
  ok = true,
  status = 200,
  contentType = "application/json",
  json,
  text,
}: MockResponseInit): Response {
  return {
    ok,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? contentType : null,
    },
    json: json ?? (() => Promise.resolve({})),
    text: text ?? (() => Promise.resolve("")),
  } as unknown as Response;
}

/** Await a promise that is expected to reject, returning the thrown ApiError. */
function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  return promise.then(
    () => {
      throw new Error("expected promise to reject");
    },
    (e) => e as ApiError,
  );
}

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
  process.env.NEXT_PUBLIC_API = BASE_URL;
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("apiFetch", () => {
  it("prefixes the base URL and defaults credentials to include", async () => {
    fetchMock.mockResolvedValue(mockResponse({}));

    await apiFetch("/events/1");

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/events/1`,
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("lets the caller override credentials", async () => {
    fetchMock.mockResolvedValue(mockResponse({}));

    await apiFetch("/events/1", { credentials: "omit" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/events/1`,
      expect.objectContaining({ credentials: "omit" }),
    );
  });

  it("throws when NEXT_PUBLIC_API is not set", async () => {
    process.env.NEXT_PUBLIC_API = "";

    await expect(apiFetch("/events/1")).rejects.toThrow(
      "NEXT_PUBLIC_API is not set",
    );
  });
});

describe("apiFetchJson", () => {
  it("returns the parsed JSON body on a 2xx response", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ json: () => Promise.resolve({ id: "abc" }) }),
    );

    const data = await apiFetchJson<{ id: string }>("/events/abc");

    expect(data).toEqual({ id: "abc" });
  });

  it("throws ApiError carrying status and payload on a non-2xx response", async () => {
    const payload = { message: "Not found" };
    fetchMock.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 404,
        json: () => Promise.resolve(payload),
      }),
    );

    const error = await expectApiError(apiFetchJson("/events/missing"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.payload).toEqual(payload);
    expect(error.message).toBe("Not found");
  });

  it("joins a NestJS ValidationPipe message array", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: ["title should not be empty", "slots must be an array"],
          }),
      }),
    );

    const error = await expectApiError(apiFetchJson("/events"));

    expect(error.message).toBe(
      "title should not be empty, slots must be an array",
    );
  });

  it("uses a plain-text error body as the message", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 502,
        contentType: "text/plain",
        text: () => Promise.resolve("Bad Gateway"),
      }),
    );

    const error = await expectApiError(apiFetchJson("/events"));

    expect(error.message).toBe("Bad Gateway");
  });

  it("falls back to a status message when the body is empty", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 500,
        contentType: "text/plain",
        text: () => Promise.resolve(""),
      }),
    );

    const error = await expectApiError(apiFetchJson("/events"));

    expect(error.message).toBe("Request failed with status 500");
  });

  it("falls back to a status message when JSON parsing fails", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error("invalid json")),
      }),
    );

    const error = await expectApiError(apiFetchJson("/events"));

    expect(error.message).toBe("Request failed with status 400");
  });
});

describe("apiFetchVoid", () => {
  it("resolves without reading the body on a 2xx response", async () => {
    const json = jest.fn(() => Promise.reject(new Error("should not be read")));
    fetchMock.mockResolvedValue(mockResponse({ status: 204, json }));

    await expect(apiFetchVoid("/events/1", { method: "DELETE" })).resolves.toBe(
      undefined,
    );
    expect(json).not.toHaveBeenCalled();
  });

  it("throws ApiError on a non-2xx response", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: "Forbidden" }),
      }),
    );

    const error = await expectApiError(apiFetchVoid("/events/1"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
    expect(error.message).toBe("Forbidden");
  });
});
