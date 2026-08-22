# Synqer web app

The Next.js half of Synqer. It is one application serving two entry points: a
normal responsive website, and the LIFF view rendered inside LINE.

## Routing

Everything lives under `app/[locale]`, split into two route groups:

- `(public)` — landing page, login, privacy, terms.
- `(protected)` — creating an event, the event lists, and the event detail tabs
  (overview, vote, results, participants, settings).

Locales are `en` and `zh-TW`, defined in [`i18n/locales.ts`](i18n/locales.ts)
and wired up with next-intl. `zh-TW` is the default.

[`middleware.ts`](middleware.ts) runs ahead of all of it and does three things,
in order:

1. A LIFF launch arrives as `/{locale}?liff.state=/path`. It is resolved to the
   real path server-side, saving a whole client document whose only job was to
   redirect.
2. Links into the retired `/hosted` and `/joined` trees are redirected to their
   current equivalents.
3. Requests carrying no session cookie are sent to `/login`. A cookie that
   exists but has expired gets past this layer and is caught by
   `(protected)/layout.tsx` once `/auth/me` answers.

## Directory conventions

| Path | Contents |
| --- | --- |
| `app/` | Route files only — page, layout, metadata. No feature logic. |
| `features/` | One directory per screen or flow, holding its components, hooks, and local state. |
| `components/` | Shared across features. `ui/` is the primitive layer (Radix + CVA); `event/` and `layout/` are shared app-level pieces. |
| `lib/` | Framework-free logic — time math, routing rules, share text, SEO metadata, the API client. |
| `hooks/` | Shared data hooks over TanStack Query (`useAuth`, `useEventDetail`, `useMyEvents`, …). |
| `contexts/` | LIFF and sidebar providers. |
| `i18n/`, `messages/` | Locale configuration, and the two message catalogues. |
| `generated/` | `openapi.ts`, generated from the backend spec. Never edited by hand. |

The test setup makes the boundary concrete: Jest only picks up `*.test.ts`, not
`.tsx`. Logic worth testing therefore gets pulled out of the component into a
plain module — either in `lib/`, or colocated next to the component that uses
it, as `features/time-grid/voting-grid/domain/selection.ts` does.

## Data flow

Every request goes through [`lib/api/apiClient.ts`](lib/api/apiClient.ts),
which prefixes `NEXT_PUBLIC_API`, sends `credentials: "include"` so the session
cookie travels with it, and turns failures into a typed `ApiError`. Request and
response types come from `generated/openapi.ts`, so a backend change that
breaks the contract shows up as a type error rather than at runtime.

TanStack Query owns the cache. Voting is deliberately not a single write: the
grid edits a *staged* draft on the server as you drag, and a separate commit
turns the draft into real votes. That is what lets the vote bar show unsaved
changes, and what makes the host's confirmation reversible in the same way.

A few pages are server-rendered with data fetched directly in `lib/server/`,
which is how an event link gets a real title and description in a link preview
before any JavaScript runs.

## LINE integration

Three pieces, each with one job:

- [`lib/line/liff.ts`](lib/line/liff.ts) wraps the LIFF SDK and initialises it
  with `NEXT_PUBLIC_LINE_LIFF_ID`.
- [`contexts/LiffContext.tsx`](contexts/LiffContext.tsx) exposes readiness and
  the LINE profile to the tree.
- [`components/providers/liffEntry.ts`](components/providers/liffEntry.ts) and
  `LiffPathHandler.tsx` decide whether the current document is inside a LIFF
  launch, and forward to `liff.line.me` when it is not.

`lib/line/line-flex-message/` builds the Flex Message payloads — the share
card, the vote-committed notice, the confirmed-result card — that the backend
then pushes into the chat.

## Environment

Two variables, both `NEXT_PUBLIC_*`, both inlined at build time rather than
read at runtime — see [`.env.example`](.env.example). Editing them locally
means restarting `npm run dev`; in production they are baked into the image by
[`Dockerfile`](Dockerfile) and changing them on Cloud Run has no effect.

## Checks

```bash
npm test
npm run lint:ci
npx tsc --noEmit
```

The type check is not optional. ts-jest is configured here without type
diagnostics, so a file with an outright type error still compiles and its tests
still pass — green tests do not mean the project type-checks. CI runs all
three.
