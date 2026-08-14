import type { Metadata } from "next";
import { eventPageMetadata } from "@/lib/server/eventPageMetadata";
import ResultsTab from "@/features/event-detail/results/ResultsTab";

/**
 * The one tab that overrides its layout's metadata.
 *
 * Its own share sheet hands out a link to a filtered reading of the grid, so
 * this URL arrives in the same chat as the link to the event itself. Previewing
 * both with the same card makes them one message repeated.
 *
 * The whole block is restated rather than only the card: metadata merges
 * shallowly, so returning a partial `openGraph` would drop `siteName`,
 * `locale` and the rest of what the layout declared. privatePageShare returns
 * it complete.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}): Promise<Metadata> {
  const { locale, eventId } = await params;

  return eventPageMetadata({ locale, eventId, view: "results" });
}

export default function Page() {
  return <ResultsTab />;
}
