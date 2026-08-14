import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { eventScheduleFields } from "@/lib/eventMetaDescription";
import { eventShareTitleKey, type EventShareView } from "@/lib/eventShare";
import { fetchEventPublicInfo } from "@/lib/server/eventPublicInfo";
import { siteUrl } from "@/lib/site";
import { EventCard } from "./EventCard";
import { loadLogo } from "./loadLogo";
import { OG_CARD_SIZE } from "./palette";

/**
 * Draw an event's share card, or hand the request to the brand card.
 *
 * Unlike the brand card this one cannot be drawn at build time — there is no
 * finite list of events to draw — so every failure that would have been a red
 * build is now a broken preview in production instead. There are more of them
 * here, too: the event has to be fetched, and Satori carries no system font, so
 * an event named in Chinese sends `next/og` off to fetch a subset covering
 * exactly those characters while the crawler waits.
 *
 * So nothing here is allowed to fail. Anything at all — an event that is
 * missing or deleted, a schedule that will not normalize, a font that will not
 * arrive — redirects to the brand card, which is a build artefact and cannot
 * fail in turn. A platform always gets an image.
 */
export async function renderEventCard(
  locale: string,
  eventId: string,
  variant: EventShareView,
): Promise<Response> {
  const drawing = isLocale(locale) ? locale : DEFAULT_LOCALE;
  // Absolute because a redirect Response requires one, and the brand card is
  // reachable at the public origin the tags already point every card at.
  const brandCard = siteUrl(`/og/${drawing}/card.png`);

  try {
    const [event, t, seo, logo] = await Promise.all([
      fetchEventPublicInfo(eventId),
      getTranslations({ locale: drawing, namespace: "eventInfo" }),
      getTranslations({ locale: drawing, namespace: "seo" }),
      loadLogo(),
    ]);

    if (!event) {
      return NextResponse.redirect(brandCard, 307);
    }

    return new ImageResponse(
      (
        <EventCard
          variant={variant}
          title={seo(eventShareTitleKey(variant), {
            name: event.title?.trim() || t("pageTitle"),
          })}
          logo={logo}
          fields={eventScheduleFields(event, drawing, {
            candidateDates: t("candidateDates"),
            candidateWeekdays: t("candidateWeekdays"),
            candidateTime: t("candidateTime"),
            votingDeadline: t("votingDeadline"),
            noDeadline: t("noDeadline"),
          })}
        />
      ),
      OG_CARD_SIZE,
    );
  } catch (error) {
    console.warn(`OG event card for ${eventId}: falling back to brand`, error);
    return NextResponse.redirect(brandCard, 307);
  }
}
