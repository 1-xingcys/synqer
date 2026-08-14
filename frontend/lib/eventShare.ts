/** Which of an event's pages a share is about. */
export type EventShareView = "event" | "results";

/**
 * The `seo` key for the line that names an event page.
 *
 * One key serves both the preview's og:title and the headline drawn on the
 * card, so the image and the text beside it cannot come to say different
 * things about the same link.
 *
 * It is not the `<title>`. A tab reads better as the event's name alone, with
 * the brand appended by the locale layout's template; a preview arriving in a
 * chat has to say what it is before it says which one.
 */
export function eventShareTitleKey(
  view: EventShareView,
): "eventShareTitle" | "eventResultsShareTitle" {
  return view === "results" ? "eventResultsShareTitle" : "eventShareTitle";
}

/** The `seo` key describing the card image itself, for `og:image:alt`. */
export function eventOgImageAltKey(
  view: EventShareView,
): "eventOgImageAlt" | "eventResultsOgImageAlt" {
  return view === "results" ? "eventResultsOgImageAlt" : "eventOgImageAlt";
}
