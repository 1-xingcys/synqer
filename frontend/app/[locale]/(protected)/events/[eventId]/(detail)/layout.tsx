import type { Metadata } from "next";
import EventDetailLayout from "@/features/event-detail/layout";
import { eventPageMetadata } from "@/lib/server/eventPageMetadata";

/** Named after the event, for all five tabs at once. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}): Promise<Metadata> {
  const { locale, eventId } = await params;

  return eventPageMetadata({ locale, eventId });
}

export default EventDetailLayout;
