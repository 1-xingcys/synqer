# Rename `/e/` routes back to `/events/`

**Date:** 2026-07-10
**Status:** Approved — ready for implementation plan

## Problem

The unified event pages currently live under a placeholder base route `/e/`
([lib/eventRoutes.ts](../../../frontend/lib/eventRoutes.ts),
`UNIFIED_EVENT_BASE = "/e"`). We want the user-facing routes to be `/events/`
instead.

A naive rename collides: the app **already** has
`app/[locale]/(protected)/events/[eventId]/page.tsx` rendering `EventJoinPage`.
If `/e/[eventId]` (the unified `JoinedEventPage`) moved to `/events/[eventId]`,
two pages would claim the same path.

The two pages are **not** mergeable — they serve different flows with different
auth:

- `events/[eventId]/page.tsx` → `EventJoinPage`: the **public invite/share
  landing**. It is the target of the LINE share link
  ([shareVoteCommitFlexMessage.ts:61](../../../frontend/lib/line-flex-message/shareVoteCommitFlexMessage.ts))
  and uses the **public** endpoint `/events/{id}/public`, because a
  non-participant cannot fetch the authenticated event detail.
- `e/[eventId]/page.tsx` → `JoinedEventPage`: the unified overview, wrapped by
  `UnifiedEventDetailLayout`, which fetches the **authenticated** detail
  (`/events/{id}`) and renders tabs/nav.

**Resolution:** keep `events/[eventId]` as the public join landing; move the
unified detail (overview + tabs) under `events/[eventId]/(detail)/`, with the
overview at `/events/{id}/overview`.

## Design

### 1. Central route switch — `lib/eventRoutes.ts`

Almost every internal link is generated through this module, so most of the
rename happens here.

```ts
export const UNIFIED_EVENT_BASE = "/events";   // was "/e"

export function eventDetailPath(eventId: string, tab?: DetailTab): string {
  return tab
    ? `${UNIFIED_EVENT_BASE}/${eventId}/${tab}`
    : `${UNIFIED_EVENT_BASE}/${eventId}/overview`;   // was no suffix
}
```

- `eventOverviewPath(status)` → `/events/{status}` (list pages) — unchanged logic.
- `DEFAULT_OVERVIEW_PATH` → `/events/voting`.
- `eventDetailPath(id)` (no tab) → `/events/{id}/overview` (the overview page).
- `eventDetailPath(id, tab)` → `/events/{id}/{tab}` for `vote|results|participants|settings`.

Consumers automatically re-point: the overview nav tab
([UnifiedEventDetailContent.tsx:91](../../../frontend/components/UnifiedEventDetail/UnifiedEventDetailLayout/UnifiedEventDetailContent.tsx)),
`EventJoinPage` post-join redirect, `AlreadyParticipantView`, `Sidebar`,
`VotingEndedView`, and all `legacy*Redirect` helpers used by the `/joined` and
`/hosted` compatibility redirect pages.

The doc comment on `UNIFIED_EVENT_BASE` (line 5) should drop the "placeholder"
wording since `/events` is now the final name.

### 2. Route folder restructure

Use a `(detail)` route group so `UnifiedEventDetailLayout` wraps the overview and
tabs but **not** the standalone join `page.tsx`:

```
app/[locale]/(protected)/events/
  [eventId]/
    page.tsx                 KEEP  → EventJoinPage (public join landing, /events/{id})
    (detail)/
      layout.tsx             MOVED from e/[eventId]/layout.tsx (re-exports UnifiedEventDetailLayout)
      overview/page.tsx      MOVED from e/[eventId]/page.tsx   (JoinedEventPage)
      vote/page.tsx          MOVED from e/[eventId]/vote/page.tsx
      results/page.tsx       MOVED from e/[eventId]/results/page.tsx
      participants/page.tsx  MOVED from e/[eventId]/participants/page.tsx
      settings/page.tsx      MOVED from e/[eventId]/settings/page.tsx
  (list)/                    MOVED wholesale from e/(list)/
    layout.tsx
    voting/page.tsx
    voting-ended/page.tsx
    confirmed/page.tsx
    completed/page.tsx
```

Then **delete** the `app/[locale]/(protected)/e/` folder entirely.

Notes:
- The `(detail)` route group is URL-transparent, so `overview` and the tab
  segments are children of `[eventId]`. `page.tsx` (the join landing) is the
  `[eventId]` index and sits **outside** the group, so it does not receive
  `UnifiedEventDetailLayout`. No `layout.tsx` is placed directly at
  `events/[eventId]/`.
- `/events/voting` (static, from `(list)`) and `/events/[eventId]` (dynamic)
  coexist — Next.js resolves static segments first. Same pattern already works
  under `/e/` today.
- The moved files' import paths use the `@/` alias, so no import edits are
  needed from relocation alone.

### 3. Header

- [Header/index.tsx:53](../../../frontend/components/Header/index.tsx): delete the
  now-redundant `pathname?.startsWith("/e/")` clause — line 50 already checks
  `startsWith("/events")`.
- [Header/pathRules.ts](../../../frontend/components/Header/pathRules.ts): add
  `"events"` to the prefix check in `isEventDetailPagePath`. The existing
  `EVENTS_OVERVIEW_STATIC_SEGMENTS` exclusion already yields:
  - `/events/voting` (list) → `false`
  - `/events/{id}/overview` and tab paths → `true`
  - `/events/{id}` (join landing) → `true` → **non-sticky detail header**
    (consistent with prior `/e/{id}` behavior; decided).

### 4. Tests

- [lib/eventRoutes.test.ts](../../../frontend/lib/eventRoutes.test.ts): update
  `/e/...` expectations to `/events/...`, and the no-tab `eventDetailPath` case
  to expect the `/overview` suffix.
- [components/Header/pathRules.test.ts](../../../frontend/components/Header/pathRules.test.ts):
  replace `/e/...` cases with `/events/...`, add a case asserting
  `/events/{id}/overview` → true and `/events/voting` → false.

## Out of scope

- No changes to `apiFetch("/events/...")` calls — those are **backend API**
  paths, unrelated to frontend routing.
- No changes to the `/joined` and `/hosted` legacy redirect pages beyond what
  the `eventRoutes.ts` helper change gives them for free.
- No new redirect from old `/e/...` URLs (placeholder route was internal-only,
  never shipped as a public URL). If external `/e/...` links exist, add
  redirects in a follow-up.

## Verification

- `/events/voting|voting-ended|confirmed|completed` render the status lists.
- `/events/{id}` (share link, non-participant) shows the join page (public
  endpoint), and joining redirects to `/events/{id}/overview` (or `/vote` when
  voting).
- `/events/{id}/overview` + `/vote` + `/results` + `/participants` + `/settings`
  render inside the tabbed unified layout; nav highlights the active tab.
- Sidebar links, back buttons, and `/joined` + `/hosted` redirects all land on
  `/events/...`.
- `frontend` unit tests pass (`eventRoutes`, `pathRules`).
```
