import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/seo/ogCard/BrandMark";
import { loadFont, WORDMARK_FONT } from "@/lib/seo/ogCard/loadFont";
import { loadLogo } from "@/lib/seo/ogCard/loadLogo";
import { OG_CARD_SIZE } from "@/lib/seo/ogCard/palette";

export const size = OG_CARD_SIZE;

export const dynamic = "force-static";

export async function GET() {
  const [logo, font] = await Promise.all([loadLogo(), loadFont()]);

  if (!logo) {
    // Half the card. Prerendered, so this is a red build rather than a preview
    // that ships with a hole where the mark should be.
    throw new Error("OG brand mark: the logo could not be read");
  }

  return new ImageResponse(<BrandMark logo={logo} />, {
    ...size,
    fonts: [{ name: WORDMARK_FONT, data: font, weight: 700, style: "normal" }],
  });
}
