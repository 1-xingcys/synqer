# Unified Event Pages — Post-Integration Refactor

**Date:** 2026-07-09
**Type:** Refactor (no user-facing behavior change except old links redirect)

## Context

PRs #145 and #146 shipped the unified event flow at `/e/*`, driven by the
`useMyEvents` hook (`GET /events/mine`). The app entry no longer routes users
into the legacy `joined` / `hosted` pages. This refactor removes the now-obsolete
semantics and dead files left behind, without changing the user experience.

Key facts established during exploration:

- New flow: overview lists `/e/{voting,voting-ended,confirmed,completed}`, detail
  `/e/[eventId]/{vote,results,participants,settings}`. Route/status helpers live in
  `frontend/lib/eventRoutes.ts`.
- Legacy still on disk: routes `/joined/*`, `/hosted/*`;
  containers `components/JoinedEventsOverview/`, `components/HostedEventsOverview/`;
  list hooks `useAttendedEvents` (`/events/attended`), `useHostedEvents` (`/events/my`)
  and their `useFiltered*` helpers.
- **Heavy reuse caveat:** the unified detail pages still mount
  `JoinedEventProvider` / `HostedEventProvider` and reuse leaf components
  (`JoinedEventResultsPage`, `JoinedEventVotePage`, `JoinedEventParticipantsPage`,
  `HostedEventPanelPage`, `HostedEventSettingsPage`, `HostedEventParticipantsPage`).
  Only *route-level*, *old-overview*, and *old-layout/guard* files are orphaned —
  the reused leaves stay.
- **Live cross-deps to re-point before deleting the old hooks:**
  - `components/EventJoinPage/useEventJoin.ts` invalidates `attendedEventsKeys.all`.
  - `components/hostedEvent/HostedEventSettingsPage/useEventSettings.ts` invalidates
    `hostedEventsKeys.all`.
- `EventRow` / `EventListWithPagination` carry a `mode: JOINED | HOSTED` enum that is
  obsolete — the unified row already decides host affordances per-item via `isHost`.

## Goals

1. Replace the redundant detail-context layer with direct react-query hooks.
2. Delete orphaned frontend files and cascade-remove the unused backend list endpoints.
3. Redirect legacy links to the unified routes so existing links keep working.
4. Redesign `EventListWithPagination` to drop the obsolete `mode` semantics.

Non-goals: any change to unified page behavior, DB schema changes, unrelated refactors.

## Design

### 1. Detail context → direct hooks

- **Delete** `contexts/JoinedEventContext.tsx` and `contexts/HostedEventContext.tsx`.
  Both merely wrap react-query hooks (`useEventDetail`, `useHostedEventDetail`) in a
  Context; react-query already dedupes concurrent identical queries, so the Context
  layer is redundant — matching the `useMyEvents` pattern.
- Extract the duplicated `isHost` computation (currently in
  `UnifiedEventDetailLayout/index.tsx` and `e/[eventId]/results/page.tsx`) into a single
  hook, e.g. `hooks/useUnifiedEventDetail.ts`, returning `{ data, isHost, isLoading, … }`.
  The layout uses it to decide whether to fetch hosted data; tabs consume it directly.
- Update consumers that currently call `useJoinedEventContext` / `useHostedEventContext`:
  - `UnifiedEventDetail/UnifiedEventDetailLayout/{index,UnifiedEventDetailContent}.tsx`
  - `UnifiedEventDetail/UnifiedVoteTab.tsx`
  - `app/[locale]/(protected)/e/[eventId]/results/page.tsx`
  - reused leaves: `JoinedEventResultsPage` (+ `useJoinedEventResults`), `JoinedEventVotePage`,
    `JoinedEventParticipantsPage`, `HostedEventPanelPage`, `HostedEventSettingsPage`
    (+ `useEventSettings`), `HostedEventParticipantsPage` (+ its state hooks).

### 2. Remove orphaned files + backend endpoints (cascade)

**Frontend deletions:**

- Legacy routes (replaced by redirects in §3): `app/[locale]/(protected)/{joined,hosted,events}/**`.
- Old overview containers: `components/JoinedEventsOverview/`, `components/HostedEventsOverview/`.
- Old layout/guard components used *only* by the legacy routes (e.g. `JoinedEventLayout/`,
  `HostedEventLayout/`, guards). The exact set is determined by a mechanical dependency
  scan — a component is deletable only if nothing under `/e/*` imports it (directly or
  transitively). Leaves reused by the unified pages stay.
- List hooks: `useAttendedEvents`, `useHostedEvents`, `useFilteredAttendedEvents`,
  `useFilteredHostedEvents`.
- **Re-point live refs first**, then the key exports vanish with their hooks:
  - `useEventJoin.ts`: `attendedEventsKeys.all` → `myEventsKeys.all`.
  - `useEventSettings.ts`: `hostedEventsKeys.all` → `myEventsKeys.all` (drop the import).

**Backend cascade** (remove `GET /events/my` and `GET /events/attended`):

1. Remove the two controller routes in `event-core.controller.ts`.
2. Remove the now-unused service methods `EventQueryService.findUserEvents` /
   `findAttendedEvents`.
3. Remove the now-unused DTOs (`HostedEventListItemDto`, `AttendedEventListItemDto`)
   and any types used only by them.
4. Update / remove the corresponding cases in `event-query.service.spec.ts`.
5. Regenerate `backend/openapi/openapi.json` and `frontend/generated/openapi.ts`.

Keep: `/events/mine`, `/events/:eventId`, `/events/:eventId/hosted`, `/events/:eventId/public`.

### 3. Old-link redirects (route files)

Each legacy path keeps a thin server component that calls `redirect()` (from
`next/navigation`), mapping targets via `eventRoutes.ts` helpers so the mapping stays
single-source:

- `/joined`, `/hosted` and their list sub-pages → `DEFAULT_OVERVIEW_PATH` (`/e/voting`).
- Detail routes → `eventDetailPath(eventId, tab)`:
  - `/joined/[eventId]/{,vote,results,participants}` → matching unified tab.
  - `/joined/[eventId]/status` → detail root (no unified equivalent).
  - `/hosted/[eventId]/{,participants,settings}` → matching unified tab.

`/events/[eventId]` is **not** redirected — it is the live invite/join-confirmation page
(`useEventShareLink` builds `/events/:eventId` as the share link), not a legacy detail route.

The locale prefix is preserved by redirecting to a path relative within `[locale]`.

### 4. `EventListWithPagination` — unified in place

- Drop the `mode` prop and delete the `EventRowMode` enum.
- Retype `events` to `MyEventItem[]` (from `useMyEvents`).
- `EventRow` decides host affordances purely from per-row `isHost` (already the primary
  path); remove the legacy `isJoined` / `mode` fallback branch and the
  `AttendedEventApiItem` / `HostedEventApiItem` type imports in `types.ts`.
- `UnifiedOverviewList` drops the `mode={EventRowMode.JOINED}` prop.
- The component stays in `components/eventCommon/eventsOverview` — still generic, just
  without dead semantics.

## Testing / Verification

- `tsc` and lint clean; existing frontend and backend tests pass.
- `event-query.service.spec.ts` updated for the removed methods.
- Manually drive the real app:
  - `/e/*` overview lists and detail (both host and guest views) render correctly.
  - At least one legacy link (e.g. `/joined/[id]/vote`) redirects to the unified route.

## Out of Scope

- Any behavioral change to the unified pages.
- Database schema / Prisma `onDelete` changes.
- Renaming `/e` or the `eventRoutes` placeholder base.
