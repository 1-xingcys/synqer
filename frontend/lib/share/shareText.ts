"use client";

/**
 * The Web Share API, wrapped so callers get a result they can branch on
 * instead of a rejected promise they have to sniff.
 *
 * This is a capability wrapper, not a feature: every surface that hands a
 * string to the OS share sheet wants exactly this, and cancelling has to be
 * told apart from failing — the user backing out of the sheet is not an error
 * and must not be reported as one.
 */

export const TextShareResult = {
  Success: "success",
  Cancelled: "cancelled",
  Error: "error",
} as const;

export type TextShareResult =
  (typeof TextShareResult)[keyof typeof TextShareResult];

export function canShareText() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

export async function shareText(opts: {
  text: string;
}): Promise<TextShareResult> {
  if (!canShareText()) {
    return TextShareResult.Error;
  }

  try {
    await navigator.share({
      text: opts.text,
    });
    return TextShareResult.Success;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return TextShareResult.Cancelled;
    }

    return TextShareResult.Error;
  }
}
