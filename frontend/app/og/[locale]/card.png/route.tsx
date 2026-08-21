import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { OG_ILLUSTRATION_URL, imageDataUrl } from "@/lib/seo/ogImage";
import { Heatmap } from "@/lib/seo/ogCard/Heatmap";
import { OG_CARD_SIZE, PALETTE } from "@/lib/seo/ogCard/palette";

export const size = OG_CARD_SIZE;

export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Satori cannot report a failed `<img src>` — a fetch that 404s takes the whole
 * card down with it. So the illustration is fetched here, where a miss can be
 * answered with the heatmap motif instead of a broken deploy.
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
