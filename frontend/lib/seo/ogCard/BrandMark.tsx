import { WORDMARK_FONT } from "./loadFont";
import { BRAND_ACCENT, PALETTE } from "./palette";

/** The mark's own proportions, kept at whatever height it is drawn. */
const MARK_RATIO = 521 / 606;
const MARK_HEIGHT = 190;

interface BrandMarkProps {
  /** The mark, inlined as a data URI. */
  logo: string;
}

/**
 * The share card every page about an event previews with.
 *
 * The logo beside the wordmark on the landing page's paper, and nothing else.
 * The card it replaced drew the event — its name as a headline, then its
 * candidate dates and voting deadline — which said in a picture exactly what
 * the `og:title` and `og:description` beside it already say in words, and paid
 * for the repetition by fetching the event on every request.
 *
 * So it says the one thing the text around it does not: whose link this is.
 *
 * Nothing here is about a particular event or a particular locale, which is
 * what lets one build artefact serve every event page in both languages.
 */
export function BrandMark({ logo }: BrandMarkProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PALETTE.surface,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        {/* next/image has nothing to optimise here: this never reaches a
            browser, and the source is already an inlined data URI. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          width={Math.round(MARK_HEIGHT * MARK_RATIO)}
          height={MARK_HEIGHT}
          alt=""
        />

        <div
          style={{
            fontFamily: WORDMARK_FONT,
            fontSize: 140,
            letterSpacing: "-0.02em",
            // The wordmark's own gradient, painted onto the letters the way the
            // site paints it. Satori supports this only for a leaf text node,
            // which is what this is.
            backgroundImage: BRAND_ACCENT,
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Synqer
        </div>
      </div>
    </div>
  );
}
