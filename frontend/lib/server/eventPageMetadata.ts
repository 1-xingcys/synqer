import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatEventMetaDescription } from "@/lib/eventMetaDescription";
import {
  brandedTitle,
  pageIdentity,
  privatePageShare,
} from "@/lib/pageMetadata";
import { fetchEventPublicInfo } from "@/lib/server/eventPublicInfo";

interface EventPageMetadata {
  locale: string;
  eventId: string;
  /**
   * Locale-less path, with a leading slash. Only a page that is a route of its
   * own passes one; the detail tabs are declared by a layout that does not know
   * which of them it is wrapping, so they go without a canonical URL.
   */
  path?: string;
}

/**
 * Title and description for a page about one event, named after that event.
 *
 * Shared by the bare event link and by the five detail tabs, so a link and the
 * page it opens are described the same way.
 *
 * An event that could not be resolved still gets a title — the generic one the
 * information panel already uses. The page below is perfectly able to render
 * without it: it fetches the event again client-side and says so if it is
 * missing.
 */
export async function eventPageMetadata({
  locale,
  eventId,
  path,
}: EventPageMetadata): Promise<Metadata> {
  const [event, t, seo] = await Promise.all([
    fetchEventPublicInfo(eventId),
    getTranslations({ locale, namespace: "eventInfo" }),
    getTranslations({ locale, namespace: "seo" }),
  ]);

  if (!event) {
    // The share block stays inherited — an event nobody can resolve has
    // nothing better to preview as than the product. The canonical URL does
    // not: claiming to be the landing page is worse than claiming nothing.
    return { title: t("pageTitle"), alternates: null };
  }

  // An event may be saved without a name, and the placeholder reads better in
  // a tab than an empty title does.
  const name = event.title?.trim() || t("pageTitle");

  const share = {
    locale,
    // The locale layout's title.template gives the tab this same shape;
    // og:title has no template of its own and has to be spelled out.
    shareTitle: brandedTitle(name),
    description: formatEventMetaDescription(event, locale, {
      candidateDates: t("candidateDates"),
      candidateWeekdays: t("candidateWeekdays"),
      candidateTime: t("candidateTime"),
      votingDeadline: t("votingDeadline"),
      noDeadline: t("noDeadline"),
    }),
    ogImageAlt: seo("ogImageAlt"),
  };

  return {
    title: name,
    ...(path ? pageIdentity({ ...share, path }) : privatePageShare(share)),
  };
}
