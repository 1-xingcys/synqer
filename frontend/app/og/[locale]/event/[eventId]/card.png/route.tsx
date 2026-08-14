import { renderEventCard } from "@/lib/ogCard/renderEventCard";

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
 * Drawn on demand and then cached: there is no finite set of events to
 * prerender. An hour is well inside how long the platforms cache a preview
 * themselves, so a card that lags an edit by that much is not visible to
 * anyone who was not already looking.
 */
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; eventId: string }> },
) {
  const { locale, eventId } = await params;

  return renderEventCard(locale, eventId, "event");
}
