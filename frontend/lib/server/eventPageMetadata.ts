import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatEventMetaDescription } from "@/lib/seo/eventMetaDescription";
import { markOgImage } from "@/lib/seo/ogImage";
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
   * Which of an event's pages the share is about. The results tab is the one
   * page shared separately from the event itself, so the two links arrive in
   * the same chat and their previews have to say which is which.
   */
  view?: "event" | "results";
}

/**
 * Title, description and share card for a page about one event.
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
    return {
      title: { absolute: brandedTitle(t("pageTitle")) },
      alternates: null,
    };
  }

  const name = event.title?.trim() || t("pageTitle");

  const share = {
    locale,
    shareTitle: seo(
      view === "results" ? "eventResultsShareTitle" : "eventShareTitle",
      { name },
    ),
    description: formatEventMetaDescription(event, locale, {
      candidateDates: t("candidateDates"),
      candidateWeekdays: t("candidateWeekdays"),
      candidateTime: t("candidateTime"),
      votingDeadline: t("votingDeadline"),
      noDeadline: t("noDeadline"),
    }),
    image: markOgImage(seo("markOgImageAlt")),
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
