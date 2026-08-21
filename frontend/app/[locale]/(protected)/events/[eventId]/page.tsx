import type { Metadata } from "next";
import EventJoinPage from "@/features/event-join";
import { eventPageMetadata } from "@/lib/server/eventPageMetadata";

/**
 * This is the link that gets shared, so it is the one page in the signed-in app
 * whose share block earns its keep: without one it inherits the landing page's,
 * and an invitation to a specific event previews as the product pitch.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}): Promise<Metadata> {
  const { locale, eventId } = await params;

  return eventPageMetadata({ locale, eventId, path: `/events/${eventId}` });
}

/**
 * A server component only so that the metadata above can be generated; the
 * page itself is the client component it renders.
 */
export default async function EventJoinPageRoute({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return <EventJoinPage eventId={eventId} />;
}
