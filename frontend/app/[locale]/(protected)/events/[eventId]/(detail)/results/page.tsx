import type { Metadata } from "next";
import { eventPageMetadata } from "@/lib/server/eventPageMetadata";
import ResultsTab from "@/features/event-detail/results/ResultsTab";

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
