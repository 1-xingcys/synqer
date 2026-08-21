# Share cards

Two PNGs, drawn with `next/og`:

| Route                   | Card                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `/og/{locale}/card.png` | The brand card: the pitch, per locale, behind the landing page and the static pages. |
| `/og/mark.png`          | The brand mark, behind every page about an event.                                    |

## Why route handlers and not `opengraph-image.tsx`

File-based metadata outranks `generateMetadata`. With an `opengraph-image.tsx`
anywhere in the `app/[locale]` tree, Next would attach that file's card to
every page under it and the `openGraph.images` our pages set would never reach
the `<head>` — which is the whole point of `pageIdentity()`, since an event
link and the landing page do not share a preview.

## Why they are `force-static`

Both cards are drawn at build time. Otherwise the illustration fetch and the
font fetch happen while a crawler waits, and a failure becomes a broken preview
in production instead of a red build.
