import { WORDMARK_FONT } from "./loadFont";
import { BRAND_ACCENT, PALETTE } from "./palette";

/** The mark's own proportions, kept at whatever height it is drawn. */
const MARK_RATIO = 521 / 606;
const MARK_HEIGHT = 190;

interface BrandMarkProps {
  /** The mark, inlined as a data URI. */
  logo: string;
}

/** The share card every page about an event previews with. */
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
