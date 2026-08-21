import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { brandedTitle } from "@/lib/seo/pageMetadata";
import type { OverviewStatus } from "@/lib/routing/eventRoutes";

/**
 * The four overview lists differ only by which status they show, in their
 * metadata as much as in their body — so each page states its status once and
 * gets the rest from here.
 *
 * They read from the same keys as the heading and subheading on the page, so a
 * tab cannot come to say something the list under it does not.
 */
export function overviewMetadata(status: OverviewStatus) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({
      locale,
      namespace: `unifiedEvents.overview.${status}`,
    });

    return { title: brandedTitle(t("title")), description: t("description") };
  };
}
