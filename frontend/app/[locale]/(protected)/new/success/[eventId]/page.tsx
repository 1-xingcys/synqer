import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CreateEventSuccessPage from "@/features/event-create/success-page";

/**
 * The last step of creating an event, and named after that: the heading here
 * announces the event was created, but the tab is still the same task the /new
 * tab was, and reads as a continuation of it rather than as a new place.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "createEvent" });

  // The locale layout's title.template turns this into "<name> | Synqer".
  return { title: t("title"), description: t("description") };
}

export default function NewEventSuccessPage() {
  return <CreateEventSuccessPage />;
}
