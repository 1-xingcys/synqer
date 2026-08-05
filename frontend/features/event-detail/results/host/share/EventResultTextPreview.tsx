"use client";

/**
 * The exact string that goes to the clipboard or the native share sheet.
 *
 * Unlike the LINE bubble this is not a mock-up of someone else's chat window
 * — it is raw text on its way out of the app — so it follows the app theme.
 * The surrounding canvas is the caller's, not this component's.
 */
export function EventResultTextPreview({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
      {text}
    </pre>
  );
}
