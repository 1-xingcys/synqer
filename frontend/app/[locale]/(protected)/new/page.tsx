import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CreateEventFormClient from "@/features/event-create/create-event-form/CreateEventFormClient";

/**
 * The page's own name, from the same key as its heading.
 *
 * No share block: this route is disallowed in robots.txt and is never linked
 * to from outside, so the landing page's is harmless where it would be wrong
 * on an event link.
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

export default async function NewEventPage() {
  const t = await getTranslations();

  return (
    <div className="max-w-4xl mx-auto py-8 pr-4">
      <div className="md:ml-6 lg:ml-18">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          {t("createEvent.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("createEvent.description")}
        </p>
      </div>

      <CreateEventFormClient />
    </div>
  );
}
