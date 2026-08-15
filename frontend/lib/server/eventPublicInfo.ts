import { cache } from "react";
import type { operations } from "@/generated/openapi";
import { normalizeEventPublicInfoResponse } from "@/lib/event/event-normalizers";
import { SITE_URL } from "@/lib/seo/site";

type EventPublicInfoResponse =
  operations["EventCoreController_getEventPublicInfo"]["responses"][200]["content"]["application/json"];

export type EventPublicInfo = ReturnType<
  typeof normalizeEventPublicInfoResponse
>;

/**
 * The API base as an absolute URL.
 *
 * `NEXT_PUBLIC_API` is written for the browser, where "/api" is a perfectly
 * good base — nginx proxies that prefix to the backend. On the server there is
 * no document to resolve it against, and `fetch("/api/...")` throws outright,
 * so the site origin stands in as the base. A value that is already absolute
 * (`http://localhost:8080`) resolves to itself and passes through untouched.
 *
 * Which means a relative base sends the request to `NEXT_PUBLIC_SITE_URL`, the
 * deployment's own public origin, and back in through nginx. Running
 * `next dev` alone — no nginx in front — there is nothing serving /api on that
 * origin, and every title falls back to the generic one. Run the stack behind
 * run-nginx.sh, or point NEXT_PUBLIC_API at the backend directly.
 */
export function resolveApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API;

  if (!base) {
    throw new Error("NEXT_PUBLIC_API is not set");
  }

  return new URL(`${base}${path}`, `${SITE_URL}/`).toString();
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
    } catch {
      // normalizeEventPublicInfoResponse throws on a malformed schedule or a
      // malformed wall clock, and fetch throws on an unreachable API. Neither
      // is a reason to fail the page.
      return null;
    }
  },
);
