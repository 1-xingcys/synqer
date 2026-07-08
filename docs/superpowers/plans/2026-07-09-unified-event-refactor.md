# Unified Event Pages Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the obsolete joined/hosted event semantics now that `/e/*` + `useMyEvents` is the sole entry point, without changing user-facing behavior (except old links redirect).

**Architecture:** Delete the redundant detail-context layer in favor of direct react-query hooks; convert legacy routes into locale-aware server redirects; delete orphaned files and cascade-remove two unused backend list endpoints; strip the dead `mode` semantics from the shared event list.

**Tech Stack:** Next.js 16 (App Router, `[locale]` segment), next-intl v4 navigation, TanStack react-query, NestJS backend, Jest (node env — no React Testing Library).

## Global Constraints

- No user-facing behavior change on `/e/*` pages; the only visible change is that legacy links redirect.
- Keep backend endpoints: `GET /events/mine`, `GET /events/:eventId`, `GET /events/:eventId/hosted`, `GET /events/:eventId/public`.
- Jest `testEnvironment` is `node` — only pure-logic units get automated tests; component correctness is gated by `npx tsc --noEmit`, `npm run lint:ci`, `npm test`, `npm run build`, and a manual drive.
- Route-target paths come from `lib/eventRoutes.ts` helpers (single source of truth) — never hardcode `/e/...` literals.
- Commit messages end with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

**Frontend (`frontend/`)**
- `lib/eventRoutes.ts` — add `legacyDetailRedirect` / `legacyOverviewRedirect` mapping helpers (Task 2).
- `lib/eventHost.ts` (new) — pure `isEventHost(userId?, ownerId?)` (Task 4).
- `lib/paginateEvents.ts` (new) — relocated generic `paginateEvents<T>` (Task 5).
- `hooks/useUnifiedEventDetail.ts` (new) — `{ data, isHost, isLoading, isFetching, error, refetch }` (Task 4).
- `app/[locale]/(protected)/{joined,hosted,events}/**` — become redirect stubs (Task 2).
- Deleted dirs/files — orphaned components, old overviews, old list hooks (Tasks 3, 5).
- `components/eventCommon/eventsOverview/{EventListWithPagination,EventRow,types,index}.tsx` — drop `mode` (Task 5).

**Backend (`backend/`)**
- `src/events/core/event-core.controller.ts` — remove two routes (Task 6).
- `src/events/core/services/event-query.service.ts` (+ `.spec.ts`) — remove two methods (Task 6).
- `src/events/core/dto/*` — remove `HostedEventListItemDto`, `AttendedEventListItemDto` (Task 6).
- `backend/openapi/openapi.json` + `frontend/generated/openapi.ts` — regenerate (Task 6).

---

## Task 1: Re-point query-key invalidations to `myEventsKeys`

Two live hooks invalidate the soon-to-be-deleted `attendedEventsKeys` / `hostedEventsKeys` after mutations. Point them at the unified `myEventsKeys` so the old key exports can later be deleted, and so the unified list refreshes after join/settings mutations.

**Files:**
- Modify: `frontend/components/EventJoinPage/useEventJoin.ts`
- Modify: `frontend/components/hostedEvent/HostedEventSettingsPage/useEventSettings.ts`

**Interfaces:**
- Consumes: `myEventsKeys` from `frontend/hooks/useMyEvents.ts` (`{ all: ["myEvents"] }`).
- Produces: nothing new.

- [ ] **Step 1: Update `useEventJoin.ts`**

Replace the import (line 7) and the invalidation call (around line 105):

```ts
// remove: import { attendedEventsKeys } from "@/hooks/useAttendedEvents";
import { myEventsKeys } from "@/hooks/useMyEvents";
```

```ts
await queryClient.invalidateQueries({ queryKey: myEventsKeys.all });
```

- [ ] **Step 2: Update `useEventSettings.ts`**

Replace the import (line 13) and the invalidation call (around line 388):

```ts
// remove: import { hostedEventsKeys } from "@/hooks/useHostedEvents";
import { myEventsKeys } from "@/hooks/useMyEvents";
```

```ts
await queryClient.invalidateQueries({ queryKey: myEventsKeys.all });
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add frontend/components/EventJoinPage/useEventJoin.ts frontend/components/hostedEvent/HostedEventSettingsPage/useEventSettings.ts
git commit -m "refactor(frontend): invalidate unified myEvents cache after join/settings mutations"
```

---

## Task 2: Legacy routes → locale-aware redirect stubs

Convert every existing legacy page into a server component that redirects to the unified route via next-intl's locale-aware `redirect`, using `eventRoutes` helpers. Delete the legacy layout files (they import components slated for deletion). After this task no legacy route imports a legacy component.

**Files:**
- Modify: `frontend/lib/eventRoutes.ts` (add helpers)
- Test: `frontend/lib/eventRoutes.test.ts`
- Rewrite (each to a redirect stub):
  - `app/[locale]/(protected)/joined/(list)/{page,voting/page,voting-ended/page,confirmed/page,completed/page}.tsx`
  - `app/[locale]/(protected)/hosted/(list)/{page,voting/page,voting-ended/page,confirmed/page,completed/page}.tsx`
  - `app/[locale]/(protected)/joined/[eventId]/{page,vote/page,results/page,participants/page,status/page}.tsx`
  - `app/[locale]/(protected)/hosted/[eventId]/{page,participants/page,settings/page}.tsx`
- **Keep untouched:** `app/[locale]/(protected)/events/[eventId]/page.tsx` — this is the live invite/join-confirmation page (`useEventShareLink` builds `/events/:eventId` as the share link), NOT a legacy detail route. Do not redirect it.
- Delete: `app/[locale]/(protected)/joined/(list)/layout.tsx`, `app/[locale]/(protected)/joined/[eventId]/layout.tsx`, `app/[locale]/(protected)/hosted/(list)/layout.tsx`, `app/[locale]/(protected)/hosted/[eventId]/layout.tsx`

**Interfaces:**
- Consumes: `DEFAULT_OVERVIEW_PATH`, `eventDetailPath`, `eventOverviewPath`, `OverviewStatus`, `DetailTab` from `eventRoutes.ts`; `redirect` from `@/i18n/routing`.
- Produces: `legacyOverviewRedirect(status?: OverviewStatus): string`, `legacyDetailRedirect(eventId: string, tab?: DetailTab): string` in `eventRoutes.ts`.

- [ ] **Step 1: Write failing tests for the redirect helpers**

Append to `frontend/lib/eventRoutes.test.ts`:

```ts
import { legacyOverviewRedirect, legacyDetailRedirect } from "./eventRoutes";

describe("legacy redirects", () => {
  it("maps a legacy overview status to the unified overview path", () => {
    expect(legacyOverviewRedirect("confirmed")).toBe("/e/confirmed");
  });

  it("falls back to the default overview when no status is given", () => {
    expect(legacyOverviewRedirect()).toBe("/e/voting");
  });

  it("maps a legacy detail tab to the unified detail path", () => {
    expect(legacyDetailRedirect("evt_1", "vote")).toBe("/e/evt_1/vote");
  });

  it("maps a legacy detail root to the unified detail root", () => {
    expect(legacyDetailRedirect("evt_1")).toBe("/e/evt_1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx jest lib/eventRoutes.test.ts`
Expected: FAIL (`legacyOverviewRedirect is not a function`).

- [ ] **Step 3: Add the helpers to `eventRoutes.ts`**

```ts
/** 舊 overview 連結（/joined, /hosted）導向統一清單。 */
export function legacyOverviewRedirect(status?: OverviewStatus): string {
  return status ? eventOverviewPath(status) : DEFAULT_OVERVIEW_PATH;
}

/** 舊 detail 連結（/joined, /hosted, /events）導向統一活動頁。 */
export function legacyDetailRedirect(eventId: string, tab?: DetailTab): string {
  return eventDetailPath(eventId, tab);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx jest lib/eventRoutes.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite the overview redirect stubs**

For each legacy overview leaf, write a server component. Example `app/[locale]/(protected)/joined/(list)/voting/page.tsx`:

```tsx
import { redirect } from "@/i18n/routing";
import { legacyOverviewRedirect } from "@/lib/eventRoutes";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: legacyOverviewRedirect("voting"), locale });
}
```

Apply the same pattern with the matching status for `voting-ended`, `confirmed`, `completed` under both `joined/(list)` and `hosted/(list)`. For the two `(list)/page.tsx` roots use `legacyOverviewRedirect()` (no argument).

- [ ] **Step 6: Rewrite the detail redirect stubs**

Example `app/[locale]/(protected)/joined/[eventId]/vote/page.tsx`:

```tsx
import { redirect } from "@/i18n/routing";
import { legacyDetailRedirect } from "@/lib/eventRoutes";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}) {
  const { locale, eventId } = await params;
  redirect({ href: legacyDetailRedirect(eventId, "vote"), locale });
}
```

Apply with the matching tab:
- `joined/[eventId]/page.tsx` → `legacyDetailRedirect(eventId)`
- `joined/[eventId]/results/page.tsx` → `legacyDetailRedirect(eventId, "results")`
- `joined/[eventId]/participants/page.tsx` → `legacyDetailRedirect(eventId, "participants")`
- `joined/[eventId]/status/page.tsx` → `legacyDetailRedirect(eventId)` (no unified equivalent → detail root)
- `hosted/[eventId]/page.tsx` → `legacyDetailRedirect(eventId)`
- `hosted/[eventId]/participants/page.tsx` → `legacyDetailRedirect(eventId, "participants")`
- `hosted/[eventId]/settings/page.tsx` → `legacyDetailRedirect(eventId, "settings")`

(`events/[eventId]/page.tsx` is intentionally excluded — it is the live join page.)

- [ ] **Step 7: Delete the legacy layout files**

```bash
git rm "frontend/app/[locale]/(protected)/joined/(list)/layout.tsx" \
       "frontend/app/[locale]/(protected)/joined/[eventId]/layout.tsx" \
       "frontend/app/[locale]/(protected)/hosted/(list)/layout.tsx" \
       "frontend/app/[locale]/(protected)/hosted/[eventId]/layout.tsx"
```

- [ ] **Step 8: Typecheck, lint, and unit tests**

Run: `cd frontend && npx tsc --noEmit && npm run lint:ci && npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add frontend/app frontend/lib/eventRoutes.ts frontend/lib/eventRoutes.test.ts
git commit -m "refactor(frontend): redirect legacy joined/hosted/events routes to unified /e"
```

---

## Task 3: Delete orphaned detail components and old overview containers

With legacy routes now redirecting, the old layouts/guards, the joined-only vote/participants pages, and the two overview container trees are unreferenced. Delete them. (List hooks are handled in Task 5 because `types.ts` still uses their types.)

**Files:**
- Delete: `frontend/components/joinedEvent/JoinedEventLayout/`, `frontend/components/joinedEvent/JoinedEventVotePage/`, `frontend/components/joinedEvent/JoinedEventParticipantsPage/`
- Delete: `frontend/components/hostedEvent/HostedEventLayout/`
- Delete: `frontend/components/JoinedEventsOverview/`, `frontend/components/HostedEventsOverview/`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Verify each target is unreferenced outside itself**

Run:

```bash
cd frontend
for d in components/joinedEvent/JoinedEventLayout components/joinedEvent/JoinedEventVotePage \
         components/joinedEvent/JoinedEventParticipantsPage components/hostedEvent/HostedEventLayout \
         components/JoinedEventsOverview components/HostedEventsOverview; do
  echo "== $d =="
  grep -rn "$d\|$(basename $d)" app components hooks lib --include=*.ts --include=*.tsx \
    | grep -v "$d/" | grep -v node_modules
done
```

Expected: no output (empty) for every target. If any line appears, it is a still-live reference — stop and reconcile before deleting.

- [ ] **Step 2: Delete the directories**

```bash
cd frontend
git rm -r components/joinedEvent/JoinedEventLayout components/joinedEvent/JoinedEventVotePage \
         components/joinedEvent/JoinedEventParticipantsPage components/hostedEvent/HostedEventLayout \
         components/JoinedEventsOverview components/HostedEventsOverview
```

- [ ] **Step 3: Typecheck, lint, tests, build**

Run: `cd frontend && npx tsc --noEmit && npm run lint:ci && npm test && npm run build`
Expected: PASS (build confirms no broken route imports).

- [ ] **Step 4: Commit**

```bash
git add -A frontend
git commit -m "refactor(frontend): remove orphaned legacy layouts and overview containers"
```

---

## Task 4: Remove detail Contexts in favor of `useUnifiedEventDetail`

Delete `JoinedEventContext` and `HostedEventContext`; migrate the remaining (kept) consumers to call the underlying react-query hooks directly. Extract the duplicated host check into a pure helper plus one shared hook.

**Files:**
- Create: `frontend/lib/eventHost.ts`, `frontend/lib/eventHost.test.ts`
- Create: `frontend/hooks/useUnifiedEventDetail.ts`
- Delete: `frontend/contexts/JoinedEventContext.tsx`, `frontend/contexts/HostedEventContext.tsx`
- Modify: `frontend/components/UnifiedEventDetail/UnifiedEventDetailLayout/index.tsx`, `frontend/components/UnifiedEventDetail/UnifiedEventDetailLayout/UnifiedEventDetailContent.tsx`, `frontend/components/UnifiedEventDetail/UnifiedVoteTab.tsx`
- Modify: `frontend/app/[locale]/(protected)/e/[eventId]/results/page.tsx`
- Modify: `frontend/components/joinedEvent/JoinedEventPage/index.tsx`, `frontend/components/joinedEvent/JoinedEventResultsPage/index.tsx`, `frontend/components/joinedEvent/JoinedEventResultsPage/useJoinedEventResults.ts`
- Modify: `frontend/components/hostedEvent/HostedEventPanelPage/index.tsx`, `frontend/components/hostedEvent/HostedEventParticipantsPage/index.tsx` (+ `hooks/useDefaultParticipantsState.ts`, `hooks/useLineGroupParticipantsState.ts`, `hooks/useReadOnlyParticipantsState.ts`), `frontend/components/hostedEvent/HostedEventSettingsPage/useEventSettings.ts`

**Interfaces:**
- Consumes: `useEventDetail(eventId)` → `{ data, isLoading, isFetching, error, refetch }`; `useHostedEventDetail(eventId)` → same shape; `useAuthContext()` → `{ user }`.
- Produces:
  - `isEventHost(userId?: string | number | null, ownerId?: string | number | null): boolean`
  - `useUnifiedEventDetail(eventId: string)` → `{ data: EventDetailData | null; isHost: boolean; isLoading: boolean; isFetching: boolean; error: string | null; refetch: () => Promise<void> }`

- [ ] **Step 1: Write the failing test for `isEventHost`**

`frontend/lib/eventHost.test.ts`:

```ts
import { isEventHost } from "./eventHost";

describe("isEventHost", () => {
  it("returns true when ids match across string/number", () => {
    expect(isEventHost(42, "42")).toBe(true);
  });
  it("returns false when ids differ", () => {
    expect(isEventHost("1", "2")).toBe(false);
  });
  it("returns false when either id is missing", () => {
    expect(isEventHost(undefined, "1")).toBe(false);
    expect(isEventHost("1", null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx jest lib/eventHost.test.ts`
Expected: FAIL (`Cannot find module './eventHost'`).

- [ ] **Step 3: Implement `isEventHost`**

`frontend/lib/eventHost.ts`:

```ts
/** 判定使用者是否為活動主辦者（容忍 string/number 型別差異）。 */
export function isEventHost(
  userId?: string | number | null,
  ownerId?: string | number | null,
): boolean {
  if (userId == null || ownerId == null) return false;
  return userId.toString() === ownerId.toString();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx jest lib/eventHost.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `useUnifiedEventDetail`**

`frontend/hooks/useUnifiedEventDetail.ts`:

```ts
import { useCallback } from "react";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useAuthContext } from "@/contexts/AuthContext";
import { isEventHost } from "@/lib/eventHost";

export function useUnifiedEventDetail(eventId: string) {
  const { data, isLoading, isFetching, error, refetch } =
    useEventDetail(eventId);
  const { user } = useAuthContext();

  const isHost = isEventHost(user?.id, data?.event.ownerId);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { data, isHost, isLoading, isFetching, error, refetch: handleRefetch };
}
```

- [ ] **Step 6: Migrate `UnifiedEventDetailLayout/index.tsx`**

Replace the whole file so it no longer mounts either provider (each host tab now fetches its own hosted data directly):

```tsx
"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useUnifiedEventDetail } from "@/hooks/useUnifiedEventDetail";
import { UnifiedEventDetailContent } from "./UnifiedEventDetailContent";

export default function UnifiedEventDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useUnifiedEventDetail(eventId);

  return (
    <UnifiedEventDetailContent isHost={isHost}>
      {children}
    </UnifiedEventDetailContent>
  );
}
```

- [ ] **Step 7: Migrate `UnifiedEventDetailContent.tsx`**

If it reads `useJoinedEventContext()`, replace that line with a direct hook call using the route param:

```tsx
import { useParams } from "next/navigation";
import { useEventDetail } from "@/hooks/useEventDetail";
// ...
const params = useParams();
const eventId = params.eventId as string;
const { data } = useEventDetail(eventId);
```

Leave the rest of the component (the `isHost` prop, layout markup) unchanged.

- [ ] **Step 8: Migrate the remaining joined-context consumers**

In each of `UnifiedVoteTab.tsx`, `joinedEvent/JoinedEventPage/index.tsx`, `joinedEvent/JoinedEventResultsPage/index.tsx`, and `joinedEvent/JoinedEventResultsPage/useJoinedEventResults.ts`, replace:

```tsx
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
// const { data, ... } = useJoinedEventContext();
```

with the direct hook, deriving `eventId` from `useParams()` (or the existing `eventId` prop/argument where one is already passed in):

```tsx
import { useEventDetail } from "@/hooks/useEventDetail";
// const { data, isLoading, error, refetch } = useEventDetail(eventId);
```

Keep each consumer's existing destructured field names — `useEventDetail` returns the same `{ data, isLoading, isFetching, error, refetch }` shape the context exposed (context `refetch` returned `Promise<void>`; if a consumer `await`s it, that still works since react-query's `refetch` returns a promise).

- [ ] **Step 9: Migrate `results/page.tsx` to the shared hook**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useUnifiedEventDetail } from "@/hooks/useUnifiedEventDetail";
import HostedEventPanelPage from "@/components/hostedEvent/HostedEventPanelPage";
import JoinedEventResultsPage from "@/components/joinedEvent/JoinedEventResultsPage";

export default function Page() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useUnifiedEventDetail(eventId);

  return isHost ? (
    <HostedEventPanelPage />
  ) : (
    <JoinedEventResultsPage eventId={eventId} />
  );
}
```

- [ ] **Step 10: Migrate the hosted-context consumers**

In each of `HostedEventPanelPage/index.tsx`, `HostedEventParticipantsPage/index.tsx` (+ its three state hooks), and `HostedEventSettingsPage/useEventSettings.ts`, replace:

```tsx
import { useHostedEventContext } from "@/contexts/HostedEventContext";
// const { data, ... } = useHostedEventContext();
```

with:

```tsx
import { useParams } from "next/navigation";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
// const params = useParams();
// const eventId = params.eventId as string;
// const { data, isLoading, isFetching, error, refetch } = useHostedEventDetail(eventId);
```

For the three participants state hooks, thread `eventId` in the same way each already obtains it (they run inside the participants page tree under `/e/[eventId]`, so `useParams()` is available). Preserve existing destructured names.

- [ ] **Step 11: Delete the two context files**

```bash
cd frontend && git rm contexts/JoinedEventContext.tsx contexts/HostedEventContext.tsx
```

- [ ] **Step 12: Verify no lingering context references**

Run:

```bash
cd frontend && grep -rn "JoinedEventContext\|HostedEventContext\|useJoinedEventContext\|useHostedEventContext" app components hooks | grep -v node_modules
```

Expected: no output.

- [ ] **Step 13: Typecheck, lint, tests, build**

Run: `cd frontend && npx tsc --noEmit && npm run lint:ci && npm test && npm run build`
Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add -A frontend
git commit -m "refactor(frontend): replace joined/hosted detail contexts with direct react-query hooks"
```

---

## Task 5: Redesign `EventListWithPagination` and delete legacy list hooks

Strip the obsolete `mode` semantics; the unified list decides host affordances per-row via `isHost`. Relocate the generic `paginateEvents` out of the doomed hook, retype the row data to `MyEventItem`, then delete the four legacy list hooks.

**Files:**
- Create: `frontend/lib/paginateEvents.ts`, `frontend/lib/paginateEvents.test.ts`
- Modify: `frontend/components/eventCommon/eventsOverview/types.ts`, `frontend/components/eventCommon/eventsOverview/EventListWithPagination.tsx`, `frontend/components/eventCommon/eventsOverview/EventRow.tsx`
- Modify: `frontend/components/UnifiedEventsOverview/UnifiedOverviewList.tsx`
- Delete: `frontend/hooks/useAttendedEvents.ts`, `frontend/hooks/useHostedEvents.ts`, `frontend/hooks/useFilteredAttendedEvents.ts`, `frontend/hooks/useFilteredHostedEvents.ts`

**Interfaces:**
- Consumes: `MyEventItem` from `@/hooks/useMyEvents`.
- Produces: `paginateEvents<T>(events: T[], currentPage: number, pageSize: number): { items: T[]; totalPages: number; totalItems: number }`; `EventListWithPagination` now takes `events: MyEventItem[]` and no `mode`; `EventRow` takes `event: MyEventItem` and no `mode`.

- [ ] **Step 1: Write the failing test for relocated `paginateEvents`**

`frontend/lib/paginateEvents.test.ts`:

```ts
import { paginateEvents } from "./paginateEvents";

describe("paginateEvents", () => {
  const items = Array.from({ length: 23 }, (_, i) => i);

  it("returns the requested page slice", () => {
    const r = paginateEvents(items, 2, 10);
    expect(r.items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(r.totalPages).toBe(3);
    expect(r.totalItems).toBe(23);
  });

  it("handles an empty list", () => {
    const r = paginateEvents([], 1, 10);
    expect(r.items).toEqual([]);
    expect(r.totalPages).toBe(0);
    expect(r.totalItems).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx jest lib/paginateEvents.test.ts`
Expected: FAIL (`Cannot find module './paginateEvents'`).

- [ ] **Step 3: Create `lib/paginateEvents.ts`**

Copy the existing implementation from `hooks/useFilteredAttendedEvents.ts` (the `paginateEvents<T>` function, ~line 123) verbatim into the new module:

```ts
export function paginateEvents<T>(
  events: T[],
  currentPage: number,
  pageSize: number,
): { items: T[]; totalPages: number; totalItems: number } {
  const totalItems = events.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (currentPage - 1) * pageSize;
  const items = events.slice(start, start + pageSize);
  return { items, totalPages, totalItems };
}
```

(If the source implementation differs, copy the source exactly rather than the sketch above, then confirm the test still passes.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx jest lib/paginateEvents.test.ts`
Expected: PASS.

- [ ] **Step 5: Retype `types.ts` and drop `EventRowMode`**

Replace `frontend/components/eventCommon/eventsOverview/types.ts` with:

```ts
import type { MyEventItem } from "@/hooks/useMyEvents";

export type EventRowData = MyEventItem;
```

(Removes `AttendedEventApiItem` / `HostedEventApiItem` imports, the `HostedEventRowData` alias, and the `EventRowMode` enum.)

- [ ] **Step 6: Update `EventListWithPagination.tsx`**

- Change the import `import { paginateEvents } from "@/hooks/useFilteredAttendedEvents";` → `import { paginateEvents } from "@/lib/paginateEvents";`
- Remove the `EventRowMode` import and the `HostedEventRowData` import.
- Change the props interface `events` type to `EventRowData[]`; delete the `mode?` field.
- Delete the `mode = EventRowMode.JOINED` default param.
- Remove `mode={mode}` from the `<EventRow>` call.

- [ ] **Step 7: Update `EventRow.tsx`**

- Change `event` prop type to `EventRowData` and remove the `mode?` prop / default.
- Delete the `const isJoined = mode === EventRowMode.JOINED;` line.
- Replace the `canCopyInviteLink` expression with the `isHost`-only form (every row now carries `isHost`):

```tsx
const canCopyInviteLink = Boolean(event.isHost);
```

- In `renderStatusIcon`, replace the `isJoined && variant === EventStatus.VOTING` condition with `!event.isHost && variant === EventStatus.VOTING` (personal vote status is a non-host concern). Preserve the existing icon markup.
- Remove the now-unused `EventRowMode` / `HostedEventRowData` imports.

- [ ] **Step 8: Update `UnifiedOverviewList.tsx`**

- Remove the `EventRowMode` import and the `EventRowData` / `HostedEventRowData` type-cast imports.
- Change the render to pass typed events without `mode`:

```tsx
<EventListWithPagination
  events={filtered}
  category={category}
  translationNamespace={TRANSLATION_NS}
/>
```

(`filtered` is already `MyEventItem[]`, so the previous `as (EventRowData | HostedEventRowData)[]` cast is dropped.)

- [ ] **Step 9: Delete the four legacy list hooks**

```bash
cd frontend && git rm hooks/useAttendedEvents.ts hooks/useHostedEvents.ts \
  hooks/useFilteredAttendedEvents.ts hooks/useFilteredHostedEvents.ts
```

- [ ] **Step 10: Verify no lingering references**

Run:

```bash
cd frontend && grep -rn "useAttendedEvents\|useHostedEvents\|useFilteredAttendedEvents\|useFilteredHostedEvents\|EventRowMode\|attendedEventsKeys\|hostedEventsKeys" app components hooks lib | grep -v node_modules
```

Expected: no output.

- [ ] **Step 11: Typecheck, lint, tests, build**

Run: `cd frontend && npx tsc --noEmit && npm run lint:ci && npm test && npm run build`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add -A frontend
git commit -m "refactor(frontend): drop obsolete list mode and legacy event-list hooks"
```

---

## Task 6: Backend cascade removal of `/events/my` and `/events/attended`

Remove the two unused list endpoints and their service methods. **Caveat:** the two list-DTO files also hold sub-DTOs (`EventScheduleDto`, `EventCapabilitiesDto`, `ConfirmedSelectionDto`, `AttendedEventHostDto`) that kept responses (`MyEventListItemDto`, `EventDetailResponseDto`, `EventPublicInfoResponseDto`, `UpdateEventResponseDto`) import. So the cascade relocates those shared sub-DTOs into a neutrally-named module, then deletes only the now-empty-of-usage list-DTO files. Finally regenerate the OpenAPI contract and frontend types.

**Files:**
- Create: `backend/src/events/core/dto/event-shared.dto.ts`
- Modify: `backend/src/events/core/event-core.controller.ts`
- Modify: `backend/src/events/core/services/event-query.service.ts`
- Modify: `backend/src/events/core/services/event-query.service.spec.ts`
- Modify (repoint sub-DTO imports): `backend/src/events/core/dto/my-event-list-item.dto.ts`, `backend/src/events/core/dto/event-detail-response.dto.ts`, `backend/src/events/core/dto/event-public-info-response.dto.ts`, `backend/src/events/core/dto/update-event-response.dto.ts`
- Delete: `backend/src/events/core/dto/hosted-event-list-item.dto.ts`, `backend/src/events/core/dto/attended-event-list-item.dto.ts`
- Regenerate: `backend/openapi/openapi.json`, `frontend/generated/openapi.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `event-shared.dto.ts` re-exports `EventScheduleDto`, `EventCapabilitiesDto`, `ConfirmedSelectionDto`, `AttendedEventHostDto`. Removes `EventCoreController_findMyEvents` and `EventCoreController_findAttendedEvents` operations from the contract.

- [ ] **Step 1: Confirm the shared sub-DTOs and locate the OpenAPI generation command**

Run:

```bash
cd backend
grep -rn "export class" src/events/core/dto/hosted-event-list-item.dto.ts src/events/core/dto/attended-event-list-item.dto.ts
grep -rn "openapi" package.json
```

Expected: `hosted-event-list-item.dto.ts` exports `ConfirmedSelectionDto`, `EventCapabilitiesDto`, `EventScheduleDto`, `HostedEventListItemDto`; `attended-event-list-item.dto.ts` exports `AttendedEventHostDto`, `AttendedEventListItemDto`. The unused top-level classes are `HostedEventListItemDto` and `AttendedEventListItemDto`; the other four are shared. Note how `openapi/openapi.json` is produced.

- [ ] **Step 2: Create the shared sub-DTO module**

Create `backend/src/events/core/dto/event-shared.dto.ts` and move the four shared classes into it **verbatim** — copy `ConfirmedSelectionDto`, `EventCapabilitiesDto`, `EventScheduleDto` out of `hosted-event-list-item.dto.ts` and `AttendedEventHostDto` out of `attended-event-list-item.dto.ts`, together with the imports they use (e.g. `EventCapabilitiesDto implements EventCapabilities`, the `@nestjs/swagger` and `@prisma/client` imports). Do not alter class bodies.

- [ ] **Step 3: Repoint every importer of the shared sub-DTOs**

In `my-event-list-item.dto.ts`, `event-detail-response.dto.ts`, `event-public-info-response.dto.ts`, and `update-event-response.dto.ts`, change imports of `ConfirmedSelectionDto` / `EventCapabilitiesDto` / `EventScheduleDto` / `AttendedEventHostDto` from `./hosted-event-list-item.dto` or `./attended-event-list-item.dto` to `./event-shared.dto`. Verify none still reference the old files for these types:

```bash
cd backend && grep -rn "hosted-event-list-item.dto\|attended-event-list-item.dto" src | grep -v "dto/hosted-event-list-item.dto.ts\|dto/attended-event-list-item.dto.ts"
```

Expected: only the controller import (`HostedEventListItemDto`, `AttendedEventListItemDto`) remains — it is removed in Step 4.

- [ ] **Step 4: Remove the two controller routes**

In `event-core.controller.ts`, delete the `@Get('my') findMyEvents(...)` block and the `@Get('attended') findAttendedEvents(...)` block, plus the now-unused imports of `HostedEventListItemDto` / `AttendedEventListItemDto`.

- [ ] **Step 5: Remove the two service methods**

In `event-query.service.ts`, delete `findUserEvents` and `findAttendedEvents` and any private helpers/imports used only by them. Verify with:

```bash
cd backend && grep -rn "findUserEvents\|findAttendedEvents" src
```

Expected: no output (only the deleted definitions existed).

- [ ] **Step 6: Delete the two list-DTO files**

```bash
cd backend && git rm src/events/core/dto/hosted-event-list-item.dto.ts src/events/core/dto/attended-event-list-item.dto.ts
```

Confirm nothing imports them:

```bash
cd backend && grep -rn "HostedEventListItemDto\|AttendedEventListItemDto\|hosted-event-list-item\|attended-event-list-item" src
```

Expected: no output.

- [ ] **Step 7: Update the service spec**

In `event-query.service.spec.ts`, remove the `describe`/`it` blocks covering `findUserEvents` and `findAttendedEvents` and any fixtures used only by them. Then run:

```bash
cd backend && npx jest src/events/core/services/event-query.service.spec.ts
```

Expected: PASS (remaining `findMyInvolvedEvents` / `findOne` / `findOneHosted` cases green).

- [ ] **Step 8: Build backend and regenerate the OpenAPI contract**

Run the project's contract-generation flow confirmed in Step 1 (typically build + emit `openapi/openapi.json`), then:

```bash
cd frontend && npm run api:gen
```

Confirm the two removed operations no longer appear:

```bash
grep -n "findMyEvents\|findAttendedEvents" backend/openapi/openapi.json frontend/generated/openapi.ts
```

Expected: no output.

- [ ] **Step 9: Full backend + frontend gate**

Run:

```bash
cd backend && npm run lint:ci && npm test && npm run build
cd ../frontend && npx tsc --noEmit && npm test
```

Expected: PASS (frontend still compiles against the regenerated `openapi.ts`; `MyEventsResponse` in `useMyEvents.ts` is unaffected because `/events/mine` remains).

- [ ] **Step 10: Commit**

```bash
git add -A backend frontend/generated/openapi.ts
git commit -m "refactor(backend): remove unused /events/my and /events/attended endpoints"
```

---

## Task 7: Final verification (whole-tree gate + manual drive)

**Files:** none (verification only).

- [ ] **Step 1: Full automated gate**

Run:

```bash
cd frontend && npx tsc --noEmit && npm run lint:ci && npm test && npm run build && npm run api:gen:check
cd ../backend && npm run lint:ci && npm test && npm run build
```

Expected: all PASS; `api:gen:check` reports no diff (contract and generated types in sync).

- [ ] **Step 2: Confirm no dead references remain**

Run:

```bash
cd frontend && grep -rn "JoinedEventContext\|HostedEventContext\|EventRowMode\|useAttendedEvents\|useHostedEvents\|useFilteredAttendedEvents\|useFilteredHostedEvents" app components hooks lib | grep -v node_modules
```

Expected: no output.

- [ ] **Step 3: Manual drive (use the run/verify skill or `npm run dev`)**

Start the app and confirm, signed in:
- `/e/voting`, `/e/voting-ended`, `/e/confirmed`, `/e/completed` render lists; host rows show the copy-invite-link affordance, non-host rows show personal vote status.
- Open an event detail as a guest and (with a hosted event) as a host — vote, results, participants, settings tabs load their data.
- Hit a legacy link, e.g. `/joined/<eventId>/vote`, and confirm it redirects to `/e/<eventId>/vote` with the locale preserved; `/joined` redirects to `/e/voting`.

- [ ] **Step 4: Final review before PR**

Confirm the working tree is clean and all task commits are present:

```bash
git status && git log --oneline main..HEAD
```

Then stop — do not open a PR until the user reviews (per project convention: implement + test first, user reviews, commit/PR only after approval).

---

## Self-Review Notes

- **Spec §1 (context refactor):** Task 4.
- **Spec §2 (frontend deletions + backend cascade):** Tasks 3 (components/overviews), 5 (list hooks), 6 (backend).
- **Spec §3 (redirects):** Task 2.
- **Spec §4 (EventListWithPagination redesign):** Task 5.
- **Live cross-deps** (`useEventJoin`, `useEventSettings`): Task 1, ahead of hook deletion.
- **Ordering invariant:** every task ends on a green tree — redirects (T2) orphan the old components before deletion (T3); contexts are removed (T4) only after their orphaned consumers are gone (T3); `paginateEvents` is relocated (T5) before its host hook is deleted; the backend endpoints are removed (T6) only after the frontend stops calling them (T5).
