import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { OG_ILLUSTRATION_URL, imageDataUrl } from "@/lib/ogImage";

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
 * Both cards are drawn at build time. Otherwise the illustration fetch and the
 * font fetch below happen while a crawler waits — and a failure becomes a
 * broken preview in production instead of a red build.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * The landing page's palette, which this card belongs to.
 *
 * Zinc on white, with the hero headline's own blue gradient as the one accent.
 * The card used to be navy, which matched nothing the visitor would find after
 * clicking it.
 */
const PALETTE = {
  surface: "linear-gradient(160deg, #ffffff 0%, #f4f4f5 100%)",
  heading: "#18181b",
  body: "#52525b",
  quiet: "#a1a1aa",
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

/**
 * Satori cannot report a failed `<img src>` — a fetch that 404s takes the whole
 * card down with it. So the illustration is fetched here, where a miss can be
 * answered with the heatmap motif instead of a broken deploy.
 *
 * The response's own `content-type` is not consulted. It is whatever the object
 * store inferred from the file name, and a JPEG uploaded as `illustration.png`
 * is announced as a PNG — a claim that decodes to an empty rectangle.
 */
async function loadIllustration(): Promise<string | null> {
  try {
    const response = await fetch(OG_ILLUSTRATION_URL, { cache: "force-cache" });
    if (!response.ok) {
      console.warn(
        `OG illustration: HTTP ${response.status}, drawing fallback`,
      );
      return null;
    }

    const dataUrl = imageDataUrl(new Uint8Array(await response.arrayBuffer()));
    if (!dataUrl) {
      // A 200 is not enough: the bytes still have to be a format we can draw.
      console.warn("OG illustration: unsupported format, drawing fallback");
    }
    return dataUrl;
  } catch (error) {
    console.warn("OG illustration: unreachable, drawing fallback", error);
    return null;
  }
}

/** Stands in for the illustration until one is uploaded: darker means freer. */
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
  const illustration = await loadIllustration();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          // No right padding: the illustration carries its own transparent
          // margin, so letting its box reach the edge is what makes the phones
          // in it read at this size rather than as a stamp.
          padding: "0 28px 0 72px",
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
              marginTop: 28,
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

        <div
          style={{
            display: "flex",
            width: 520,
            height: 630,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {illustration ? (
            // Satori lays out from the stated box, not from the decoded file,
            // so the box has to be told to letterbox — otherwise a portrait
            // illustration is stretched to whatever shape it is given.
            // next/image has nothing to optimise here: this never reaches a
            // browser, and the source is already an inlined data URI.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={illustration}
              width={520}
              height={630}
              style={{ objectFit: "contain" }}
              alt=""
            />
          ) : (
            <Heatmap />
          )}
        </div>
      </div>
    ),
    size,
  );
}
