import { renderEventCard } from "@/lib/ogCard/renderEventCard";

/**
 * The share card for an event's results tab.
 *
 * A card of its own because that tab is shared on its own: the results view
 * hands out a link to a filtered reading of the grid, and it arrives in the
 * same chat as the link to the event. Without something to tell them apart the
 * two are the same preview twice.
 *
 * The filter the link carries is deliberately not drawn. It names participants
 * by id, and a preview is an image anyone holding the link can fetch. The card
 * knows the event and nothing else.
 */

/** Drawn per request, like its sibling, and for the same reasons. */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; eventId: string }> },
) {
  const { locale, eventId } = await params;

  return renderEventCard(locale, eventId, "results");
}
