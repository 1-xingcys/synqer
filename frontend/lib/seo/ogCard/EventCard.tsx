import { BRAND_ACCENT, PALETTE, RESULTS_ACCENT } from "./palette";
import type { EventScheduleField } from "@/lib/seo/eventMetaDescription";
import type { EventShareView } from "@/lib/seo/eventShare";

interface EventCardProps {
  variant: EventShareView;
  /**
   * What this card is *and* which event it is about — "投票活動：週五聚餐".
   * The same string the preview's og:title carries, so the headline in the
   * image and the line beside it say the same thing.
   */
  title: string;
  /** The same rows the page's description is built from. */
  fields: EventScheduleField[];
  /** The wordmark, inlined as a data URI. Absent if it could not be read. */
  logo: string | null;
}

/**
 * A share card for one event, in the landing page's palette.
 *
 * Text and nothing else. An earlier draft set a heatmap motif beside the copy,
 * which cost the words half the width for a picture that was decoration —
 * these cards are read at thumbnail size in a chat list, where type large
 * enough to read is worth more than an illustration.
 *
 * The two variants differ by their accent and by what the title says. Nothing
 * else needs to: the title carries the distinction in words, which survives
 * being scaled down and being read aloud, as a colour does not.
 *
 * No people appear on it. A preview is an image anyone holding the link can
 * fetch without signing in, and it cannot be taken back once a platform has
 * cached it.
 */
export function EventCard({ variant, title, fields, logo }: EventCardProps) {
  const isResults = variant === "results";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "54px 80px",
        background: PALETTE.surface,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 128,
          height: 10,
          borderRadius: 5,
          background: isResults ? RESULTS_ACCENT : BRAND_ACCENT,
        }}
      />

      <div
        style={{
          // Satori clamps through the same webkit properties a browser does.
          // Without them a long name pushes the schedule off the bottom of the
          // card rather than wrapping into it.
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1.22,
          color: PALETTE.heading,
          letterSpacing: "-0.01em",
          marginTop: 26,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 44,
        }}
      >
        {fields.map((field) => (
          <div
            key={field.label}
            // Aligned to the top rather than to a baseline: a value long enough
            // to wrap shares its *last* line's baseline, which dropped the
            // label to the bottom of the row and read as broken.
            style={{ display: "flex", alignItems: "flex-start", gap: 24 }}
          >
            <div
              style={{
                fontSize: 29,
                lineHeight: 1.4,
                color: PALETTE.quiet,
                // A fixed column keeps the values aligned across rows whose
                // labels are of very different widths in English.
                width: 270,
                // Centres the smaller label against the first line of the
                // value rather than hanging it from the same top edge.
                paddingTop: 6,
              }}
            >
              {field.label}
            </div>
            <div
              style={{
                fontSize: 40,
                lineHeight: 1.4,
                color: PALETTE.body,
                flex: 1,
              }}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>

      {/* Out of the flow and pinned to the corner, so the copy above is
          centred against the whole card rather than against what the wordmark
          left over. They share the same vertical band and never collide: the
          copy is left-aligned and stops well short of this corner. */}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 54,
          display: "flex",
          alignItems: "center",
          gap: 13,
        }}
      >
        {logo ? (
          // next/image has nothing to optimise here: this never reaches a
          // browser, and the source is already an inlined data URI.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={42} height={42} alt="" />
        ) : null}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
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
