import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatEventMetaDescription } from "@/lib/seo/eventMetaDescription";
import { eventOgImage } from "@/lib/seo/ogImage";
import {
  eventOgImageAltKey,
  eventShareTitleKey,
  type EventShareView,
} from "@/lib/seo/eventShare";
import {
  brandedTitle,
  pageIdentity,
  privatePageShare,
} from "@/lib/seo/pageMetadata";
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
  /**
   * Which card to preview with. The results tab is the one page about an event
   * that is shared separately from the event itself, so it is the one that
   * needs a card saying which of the two a link goes to.
   */
  view?: EventShareView;
}

/**
 * Title, description and share card for a page about one event.
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
  view = "event",
}: EventPageMetadata): Promise<Metadata> {
  const [event, t, seo] = await Promise.all([
    fetchEventPublicInfo(eventId),
    getTranslations({ locale, namespace: "eventInfo" }),
    getTranslations({ locale, namespace: "seo" }),
  ]);

  if (!event) {
    // The share block stays inherited — an event nobody can resolve has
    // nothing better to preview as than the product, which is also what its
    // card would have redirected to. The canonical URL does not: claiming to
    // be the landing page is worse than claiming nothing.
    return {
      title: { absolute: brandedTitle(t("pageTitle")) },
      alternates: null,
    };
  }

  // An event may be saved without a name, and the placeholder reads better in
  // a tab than an empty title does.
  const name = event.title?.trim() || t("pageTitle");

  const share = {
    locale,
    // Not the tab's title. That is the event's name alone, which reads well in
    // a row of tabs because the brand is already the window. A preview lands in
    // a chat among other people's links and has to say what it is first.
    shareTitle: seo(eventShareTitleKey(view), { name }),
    description: formatEventMetaDescription(event, locale, {
      candidateDates: t("candidateDates"),
      candidateWeekdays: t("candidateWeekdays"),
      candidateTime: t("candidateTime"),
      votingDeadline: t("votingDeadline"),
      noDeadline: t("noDeadline"),
    }),
    image: eventOgImage(
      locale,
      eventId,
      view,
      seo(eventOgImageAltKey(view), { name }),
    ),
  };

  return {
    // Stated in full rather than left to the locale layout's title.template.
    // The detail layout declares a plain-string title of its own, and that
    // clears the inherited template for the segments below it — which left the
    // results tab, the one tab with metadata of its own, as the only page on
    // the site whose tab did not carry the brand.
    title: { absolute: brandedTitle(name) },
    ...(path ? pageIdentity({ ...share, path }) : privatePageShare(share)),
  };
}
