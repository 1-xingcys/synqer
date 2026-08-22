import { cache } from "react";
import type { operations } from "@/generated/openapi";
import { normalizeEventPublicInfoResponse } from "@/lib/event/event-normalizers";

type EventPublicInfoResponse =
  operations["EventCoreController_getEventPublicInfo"]["responses"][200]["content"]["application/json"];

export type EventPublicInfo = ReturnType<
  typeof normalizeEventPublicInfoResponse
>;

class ApiBaseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiBaseUrlError";
  }
}

/**
 * The API base, as an absolute URL.
 */
export function resolveApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API;

  if (!base) {
    throw new ApiBaseUrlError("NEXT_PUBLIC_API is not set");
  }

  if (!/^https?:\/\//.test(base)) {
    throw new ApiBaseUrlError(
      `NEXT_PUBLIC_API must be absolute for server-side requests, got "${base}". ` +
        "Point it at your tunnel host, e.g. https://YOUR_TUNNEL_HOST/api.",
    );
  }

  return `${base.replace(/\/+$/, "")}${path}`;
}

/**
 * An event's public information, for the metadata of the pages that show it.
 *
 * `cache()` is what keeps the detail routes to one request rather than two:
 * the layout and the page below it both generate metadata within the same
 * render pass.
 */
export const fetchEventPublicInfo = cache(
  async (eventId: string): Promise<EventPublicInfo | null> => {
    try {
      const response = await fetch(
        resolveApiUrl(`/events/${eventId}/public`),
        // The values below feed a title and a description that change whenever
        // the host edits the event, and the page they sit on is dynamic
        // anyway.
        { cache: "no-store" },
      );

      if (!response.ok) {
        return null;
      }

      const event = normalizeEventPublicInfoResponse(
        (await response.json()) as EventPublicInfoResponse,
      );

      // A deleted event keeps answering, so that the page can say so. Its
      // title is not worth announcing.
      return event.isDeleted ? null : event;
    } catch (error) {
      // normalizeEventPublicInfoResponse throws on a malformed schedule or a
      // malformed wall clock, and fetch throws on an unreachable API. Neither
      // is a reason to fail the page. A base URL that cannot be used is, so
      // it is reported rather than swallowed.
      if (error instanceof ApiBaseUrlError) {
        console.error(`[eventPublicInfo] ${error.message}`);
      }

      return null;
    }
  },
);
