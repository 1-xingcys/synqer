import { renderEventCard } from "@/lib/seo/ogCard/renderEventCard";

/**
 * The share card for one event.
 *
 * A route handler rather than an `opengraph-image.tsx`, for the same reason
 * the brand card is one: file-based metadata outranks `generateMetadata`, and
 * the `openGraph.images` the page sets would never reach the `<head>`.
 *
 * The directory is literally named `card.png` so the URL ends in an extension.
 * Middleware's matcher skips any path containing a dot, which keeps the locale
 * middleware from redirecting this away from itself.
 */

/**
 * Drawn per request. There is no finite set of events to prerender, and the
 * public-info fetch behind it is `no-store`, which opts the route out of the
 * route cache — a `revalidate` here reads as caching and does nothing.
 *
 * Measured against a production build: ~145ms steady, ~680ms on the very first
 * card of a process, which is `next/og` fetching the CJK subset it then keeps.
 * A preview fetcher waits seconds and asks once, then caches the answer for
 * days, so the cost lands well inside what it will wait for — and the card can
 * never disagree with an event the host has just edited.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; eventId: string }> },
) {
  const { locale, eventId } = await params;

  return renderEventCard(locale, eventId, "event");
}
