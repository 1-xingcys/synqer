import { cache } from "react";
import type { operations } from "@/generated/openapi";
import { normalizeEventPublicInfoResponse } from "@/lib/event/event-normalizers";

type EventPublicInfoResponse =
  operations["EventCoreController_getEventPublicInfo"]["responses"][200]["content"]["application/json"];

export type EventPublicInfo = ReturnType<
  typeof normalizeEventPublicInfoResponse
>;

/**
 * A base URL that cannot be used, as opposed to an API that did not answer.
 *
 * The two are worth telling apart because only one of them is anybody's
 * mistake: fetchEventPublicInfo swallows failures by design, and this is the
 * one it should say something about on the way past.
 */
class ApiBaseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiBaseUrlError";
  }
}

/**
 * The API base, as an absolute URL.
 *
 * One value serves the browser and the server both, because in this system the
 * two always want the same origin: production has synqer.club calling
 * api.synqer.club, and local development reaches the frontend and the backend
 * through the one tunnel host that nginx merges them behind.
 *
 * Absolute is the part that matters. The browser would take "/api" happily and
 * resolve it against the document it loaded; a server fetch has no document,
 * and a relative base throws. So the tunnel host has to be spelled out in
 * `NEXT_PUBLIC_API` even though the browser alone would not need it.
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
 * `GET /events/:id/public` is the one event endpoint with no session guard —
 * it backs the bare event link, which strangers open. That is what makes
 * server-rendered titles possible here at all: `generateMetadata` carries no
 * session, and every other event endpoint would answer it with a 401.
 *
 * `cache()` is what keeps the detail routes to one request rather than two:
 * the layout and the page below it both generate metadata within the same
 * render pass.
 *
 * @returns null for an event that is missing, deleted, or malformed, and for
 *   an API that did not answer. A page whose title could not be resolved still
 *   has to render — throwing here would turn a cosmetic gap into a 500.
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
      // is a reason to fail the page.
      //
      // A base URL that cannot be used is different in kind: nothing will ever
      // answer, and the symptom — every event page wearing the generic title —
      // says nothing about the cause. Still not worth a 500, but worth saying
      // out loud once per render.
      if (error instanceof ApiBaseUrlError) {
        console.error(`[eventPublicInfo] ${error.message}`);
      }

      return null;
    }
  },
);
