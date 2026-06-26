"use client";

/**
 * Standardized API error object.
 * Contains HTTP status and parsed error payload from server response.
 */
export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getApiBaseUrl(): string {
  if (!process.env.NEXT_PUBLIC_API) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }
  return process.env.NEXT_PUBLIC_API;
}

/**
 * Build final request URL from relative path or passthrough absolute URL.
 */
function toApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

/**
 * Parse error response body as JSON when possible, otherwise text.
 */
async function parseErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json().catch(() => undefined);
  }
  return response.text().catch(() => undefined);
}

/** Extract message from a parsed error payload. */
function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message: unknown };
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    // NestJS ValidationPipe return message: string[]
    if (Array.isArray(message) && message.length > 0) {
      return message.join(", ");
    }
  }
  return `Request failed with status ${status}`;
}

/**
 * Low-level fetch wrapper:
 * - resolves API base URL
 * - defaults credentials to "include"
 */
export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(toApiUrl(path), {
    ...init,
    credentials: init?.credentials ?? "include",
  });
}

/**
 * Fetch JSON data and throw ApiError on non-2xx responses.
 * Error message is derived from server payload when available.
 */
export async function apiFetchJson<T>(path: string, init?: RequestInit) {
  const response = await apiFetch(path, init);

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const message = extractErrorMessage(payload, response.status);
    throw new ApiError(message, response.status, payload);
  }

  return response.json() as Promise<T>;
}
