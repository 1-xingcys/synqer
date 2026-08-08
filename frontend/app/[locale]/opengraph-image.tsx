import { ImageResponse } from "next/og";
import { LOCALES } from "@/i18n/locales";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Synqer — when2meet, inside LINE";

/**
 * Without this the route is rendered on demand, and the first crawler to ask
 * for the card waits on the image being drawn. The card is the same in every
 * locale, so this only decides when it is drawn, not how many exist.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * The share card, drawn rather than designed in a file.
 *
 * The text is deliberately Latin-only: `next/og` ships a Latin font, and any
 * Chinese in here would render as tofu unless a CJK face were bundled and
 * loaded. The heatmap column carries the product idea instead, in a language
 * that needs no font at all.
 */

/** The results heatmap's own emerald ramp, at the five steps it uses. */
const RAMP = ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981"];

const COLUMNS = [
  [0, 1, 0, 2, 1],
  [1, 2, 3, 3, 2],
  [0, 1, 1, 2, 0],
  [2, 3, 4, 4, 3],
  [1, 2, 2, 3, 2],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 90px",
          background: "linear-gradient(135deg, #1b2340 0%, #2b3a63 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 34,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6780c7, #78b0e0)",
              }}
            />
            <div style={{ fontSize: 38, fontWeight: 700, color: "#ffffff" }}>
              Synqer
            </div>
          </div>

          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Find a time everyone can meet
          </div>

          <div style={{ fontSize: 31, color: "#9fb4e0", marginTop: 26 }}>
            when2meet, inside LINE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 44,
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "9px 20px",
                borderRadius: 999,
                background: "#06C755",
                color: "#ffffff",
                fontSize: 23,
                fontWeight: 600,
              }}
            >
              LINE
            </div>
            <div style={{ fontSize: 23, color: "#8195c4" }}>synqer.club</div>
          </div>
        </div>

        {/* The results heatmap, as a motif: darker means more people free. */}
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
                    background: step === 0 ? "#ffffff14" : RAMP[step],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
