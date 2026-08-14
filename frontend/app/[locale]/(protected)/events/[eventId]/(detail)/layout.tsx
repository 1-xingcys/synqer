import type { Metadata } from "next";
import EventDetailLayout from "@/features/event-detail/layout";
import { eventPageMetadata } from "@/lib/server/eventPageMetadata";

/**
 * Named after the event, for all five tabs at once.
 *
 * It is declared here rather than on each tab because the answer is the same
 * on all of them, and because one declaration is one lookup: `generateMetadata`
 * on the page below would resolve the same event a second time within the same
 * render pass, which the cache around the fetch is what prevents.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}): Promise<Metadata> {
  const { locale, eventId } = await params;

  return eventPageMetadata({ locale, eventId });
}

export default EventDetailLayout;
