import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";

/**
 * The brand share card.
 *
 * A route handler rather than an `opengraph-image.tsx`, because file-based
 * metadata outranks `generateMetadata` — with that convention in the tree, the
 * `openGraph.images` the locale layout sets would never reach the `<head>`.
 * Nothing here is special to Next's metadata; it is an endpoint that returns a
 * PNG, and `brandOgImage()` is what points the tags at it.
 *
 * The copy is drawn rather than baked into artwork so the two locales share one
 * layout, and so a wording change is a change to the message catalogue. The
 * renderer needs no bundled CJK font for that: the `@vercel/og` inside Next
 * detects the script and fetches a subset covering exactly these characters.
 *
 * The directory is literally named `card.png` so the URL ends in an extension.
 * Middleware's matcher skips any path containing a dot, which keeps the locale
 * middleware from redirecting this away from itself.
 */

export const size = { width: 1200, height: 630 };

/**
 * Both cards are drawn at build time. Otherwise the font fetch happens while a
 * crawler waits — and a failure becomes a broken preview in production instead
 * of a red build.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * The landing page's palette, which this card belongs to.
 *
 * Zinc on white. The card used to be navy, which matched nothing the visitor
 * would find after clicking it.
 */
const PALETTE = {
  surface: "linear-gradient(160deg, #ffffff 0%, #f4f4f5 100%)",
  heading: "#18181b",
  body: "#52525b",
  emptyCell: "#f4f4f5",
} as const;

/** The results heatmap's own emerald ramp, at the five steps it uses. */
const RAMP = ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981"];

const COLUMNS = [
  [0, 1, 0, 2, 1],
  [1, 2, 3, 3, 2],
  [0, 1, 1, 2, 0],
  [2, 3, 4, 4, 3],
  [1, 2, 2, 3, 2],
];

/** The results heatmap, as a motif: darker means more people free. */
function Heatmap() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {COLUMNS.map((column, columnIndex) => (
        <div
          key={columnIndex}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {column.map((step, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                width: 62,
                height: 62,
                borderRadius: 10,
                background: step === 0 ? PALETTE.emptyCell : RAMP[step],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const drawing = isLocale(locale) ? locale : DEFAULT_LOCALE;

  const t = await getTranslations({ locale: drawing, namespace: "seo" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 72px",
          background: PALETTE.surface,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 580 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.2,
              color: PALETTE.heading,
              letterSpacing: "-0.01em",
            }}
          >
            {t("og_title")}
          </div>

          <div
            style={{
              fontSize: 25,
              lineHeight: 1.5,
              color: PALETTE.body,
              marginTop: 22,
            }}
          >
            {t("description")}
          </div>
        </div>

        <Heatmap />
      </div>
    ),
    size,
  );
}
