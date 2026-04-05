"use client";

export const TextShareResult = {
  Success: "success",
  Cancelled: "cancelled",
  Error: "error",
} as const;

export type TextShareResult =
  (typeof TextShareResult)[keyof typeof TextShareResult];

export function canShareHostedEventResultText() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

export async function shareHostedEventResultText(opts: {
  text: string;
}): Promise<TextShareResult> {
  if (!canShareHostedEventResultText()) {
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
