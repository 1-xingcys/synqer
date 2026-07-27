# Axis Span & Time Module Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `startDate: string` + sibling `axisType` pairing with a discriminated `AxisSpan`, then gather the time modules into `lib/time/` and `lib/event-time/`.

**Architecture:** One `AxisSpan` union ties the axis payload to its discriminant, so a weekday can no longer occupy a field named `startDate` or reach the date formatter. Producers are migrated one at a time behind adapters built at the call sites, so every task compiles and ships on its own. Part B is pure file movement with no behaviour change.

**Tech Stack:** TypeScript 5.9, Next.js, jest + ts-jest (`testEnvironment: "node"`, `testMatch: ["**/*.test.ts"]` — no component tests), next-intl, prettier, eslint.

## Global Constraints

- Run every command from `frontend/`.
- Verification for every task: `npx tsc --noEmit`, `npx eslint .`, `npx jest` — all must be clean before the commit step.
- Any task touching calendar-day parsing additionally runs the suite under four zones: `for tz in America/New_York Pacific/Kiritimati Asia/Taipei UTC; do TZ=$tz npx jest; done`.
- `generated/openapi.ts` is generated. Never edit it, and revert it if prettier touches it: `git checkout -- generated/openapi.ts`.
- Jest only collects `*.test.ts`. There is no jsdom and no `@testing-library`, so **no component may be tested by rendering**. Extract logic into a `.ts` module and test that instead.
- `CalendarDay` and `WallClock` are branded. A raw string becomes one only through `calendarDay()` / `wallClock()`, which throw on bad input. Never use `as CalendarDay`.
- Axis discriminant values are `"DATE"` and `"WEEKDAY"` (uppercase), matching `EventSlotAxisType` from the generated schema. Do not introduce a lowercase spelling.
- Commit messages: no emojis; end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Scope Note

Part A and Part B are independently shippable. **Do not start Part B until Part A is merged** — Part A rewrites `components/eventCommon/timeRangeFormat.ts`, which Part B moves. Running them together produces a diff no reviewer can read.

---

## Background: what is actually broken

Three independent mechanisms currently answer "is this axis a weekday or a date":

| Mechanism | Location |
|---|---|
| `slot.axisType === "WEEKDAY"` | the DB field, on `EventSlot` / `TimeSlot` / `HostedResultSlot` |
| `range.startDate === range.endDate` | `formatLocalizedRangeLabel`, `timeRangeFormat.ts` |
| `columnsByKey.get(key)?.kind === "weekday"` | `ResultsHeatmapGrid.showModalForSelection` |

The second is a heuristic, not a check. A weekday range whose ends differ falls past it into the date formatter. That case is currently unreachable — the merge loops keep a weekday range's ends equal — but nothing in the types says so, and the failure is a thrown `TypeError` from `calendarDay()`.

`AxisSpan` collapses all three into one and makes the bad state unrepresentable.

## File Structure

**Part A — created:**
- `lib/axisSpan.ts` — the `AxisSpan` union and its constructors. One responsibility: representing which axis position a slot or range occupies.
- `lib/axisSpan.test.ts` — its tests.

**Part A — modified:**
- `components/eventCommon/timeRangeFormat.ts` — `formatLocalizedRangeLabel` consumes `AxisSpan`; the `as Weekday` cast is deleted.
- `components/hostedEvent/resultSummary.ts` — `MergedConfirmedRange` / `HostedResultSummaryRange` carry `AxisSpan`; local `getSlotAxisKey` deleted.
- `components/hostedEvent/HostedEventPanelPage/types.ts` — `SelectedTimeRange` carries `AxisSpan`.
- `components/hostedEvent/HostedEventPanelPage/hooks/useEventTimeSelection.ts` — local `getSlotDateKey` deleted.
- `components/eventCommon/timeGrid/types.ts` — `GridAxisColumn` becomes a discriminated union.
- `components/eventCommon/timeGrid/utils.ts` — local `getSlotAxisKey` deleted; label helpers narrow on the discriminant.
- `components/eventCommon/timeGrid/ResultsView/hooks/useResultsRangeSelection.ts` — `SelectionRange` carries `AxisSpan`.
- `components/eventCommon/timeGrid/ResultsView/ResultsHeatmapGrid.tsx` — the `columnsByKey` kind lookup is deleted.
- `lib/event-presentation.ts` — `formatAxisKeyLabel` consumes `AxisSpan`.
- Callers updated in step with their producer: `components/hostedEvent/hostedEventResultText.ts`, `components/hostedEvent/HostedEventPanelPage/EventTimeSelector.tsx`, `lib/line-flex-message/hostedEventResultFlexMessage.ts`, `components/eventCommon/confirmed-time-formatters.ts`.

**Part B — final layout:**

```
lib/time/          primitives, no product vocabulary
  index.ts         re-exports the three below
  zone.ts          zonedWallClockToInstant, instantToZonedWallClock,
                   formatDateTimeInZone, formatDateInZone,
                   resolveDefaultTimeZone, DEFAULT_TIME_ZONE   (from lib/time.ts)
  calendarDay.ts   unchanged content, moved from lib/calendarDay.ts
  wallClock.ts     unchanged content, moved from lib/wallClock.ts
  minuteOfDay.ts   formatMinutesToTime                          (from lib/utils.ts)

lib/event-time/    product labels, may name events/deadlines/slots
  index.ts         re-exports the four below
  rangeLabel.ts    from components/eventCommon/timeRangeFormat.ts
  confirmed.ts     from components/eventCommon/confirmed-time-formatters.ts
  votingDeadline.ts  unchanged content, moved from lib/votingDeadline.ts
  weekdays.ts      unchanged content, moved from lib/weekdays.ts
```

`lib/utils.ts` keeps only `cn()`. `lib/axisSpan.ts` stays at `lib/` — it is a shape, not a time value.

---

# Part A — AxisSpan

### Task A1: The AxisSpan union and its constructors

**Files:**
- Create: `frontend/lib/axisSpan.ts`
- Test: `frontend/lib/axisSpan.test.ts`

**Interfaces:**
- Consumes: `axisDateToCalendarDay` from `@/lib/calendarDay`; `Weekday`, `EventSlotAxisType` from `@/types/event`.
- Produces: `type AxisSpan`; `axisSpanOfSlot(slot: AxisSlotLike): AxisSpan | null`; `axisSpanKey(span: AxisSpan): string`; `extendAxisSpan(span: AxisSpan, next: AxisSpan): AxisSpan | null`; `type AxisSlotLike`.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/axisSpan.test.ts`:

```typescript
import { describe, expect, it } from "@jest/globals";
import {
  axisSpanKey,
  axisSpanOfSlot,
  extendAxisSpan,
  type AxisSpan,
} from "@/lib/axisSpan";
import { calendarDay } from "@/lib/calendarDay";

const day = (value: string): AxisSpan => ({
  axisType: "DATE",
  startDay: calendarDay(value),
  endDay: calendarDay(value),
});

describe("axisSpanOfSlot", () => {
  it("reads a weekday slot as a weekday span", () => {
    expect(
      axisSpanOfSlot({ axisType: "WEEKDAY", axisWeekday: "MONDAY" }),
    ).toEqual({ axisType: "WEEKDAY", weekday: "MONDAY" });
  });

  // axisDate is a naive wall-clock value carrying its digits in the UTC
  // fields, so the day must be read out of those rather than local getters.
  it("reads a date slot as a single-day span in any runner zone", () => {
    expect(
      axisSpanOfSlot({ axisType: "DATE", axisDate: "2026-07-30T00:00:00.000Z" }),
    ).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-30",
    });
  });

  it("returns null when the slot is missing its key", () => {
    expect(axisSpanOfSlot({ axisType: "WEEKDAY", axisWeekday: null })).toBeNull();
    expect(axisSpanOfSlot({ axisType: "DATE", axisDate: null })).toBeNull();
  });
});

describe("axisSpanKey", () => {
  it("keys a weekday span by its weekday", () => {
    expect(axisSpanKey({ axisType: "WEEKDAY", weekday: "MONDAY" })).toBe(
      "MONDAY",
    );
  });

  it("keys a date span by its start day", () => {
    expect(axisSpanKey(day("2026-07-30"))).toBe("2026-07-30");
  });
});

describe("extendAxisSpan", () => {
  it("extends a date span onto the next day", () => {
    expect(extendAxisSpan(day("2026-07-30"), day("2026-07-31"))).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-31",
    });
  });

  it("refuses a gap", () => {
    expect(extendAxisSpan(day("2026-07-30"), day("2026-08-01"))).toBeNull();
  });

  it("refuses to mix axis kinds", () => {
    expect(
      extendAxisSpan(day("2026-07-30"), {
        axisType: "WEEKDAY",
        weekday: "MONDAY",
      }),
    ).toBeNull();
  });

  // A weekday span covers exactly one weekday: there is no second end to move.
  it("extends a weekday span only onto itself", () => {
    const monday: AxisSpan = { axisType: "WEEKDAY", weekday: "MONDAY" };
    expect(extendAxisSpan(monday, monday)).toEqual(monday);
    expect(
      extendAxisSpan(monday, { axisType: "WEEKDAY", weekday: "TUESDAY" }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/axisSpan`
Expected: FAIL — `Cannot find module '@/lib/axisSpan'`.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/lib/axisSpan.ts`:

```typescript
import { addCalendarDays, axisDateToCalendarDay } from "@/lib/calendarDay";
import type { CalendarDay } from "@/lib/calendarDay";
import type { EventSlotAxisType, Weekday } from "@/types/event";

/**
 * The axis position a slot or range occupies.
 *
 * RECURRING events are keyed by weekday, one-time events by calendar day.
 * These used to travel as `startDate: string` plus a sibling `axisType`, which
 * let a weekday sit in a field named `startDate` and reach the date formatter.
 * Tying the payload to the discriminant makes that unrepresentable.
 *
 * A weekday span covers exactly one weekday — only a date span has two ends.
 */
export type AxisSpan =
  | { axisType: "WEEKDAY"; weekday: Weekday }
  | { axisType: "DATE"; startDay: CalendarDay; endDay: CalendarDay };

/** The slot fields an axis span is derived from. */
export type AxisSlotLike = {
  axisType: EventSlotAxisType;
  axisDate?: string | Date | null;
  axisWeekday?: Weekday | null;
};

export function axisSpanOfSlot(slot: AxisSlotLike): AxisSpan | null {
  if (slot.axisType === "WEEKDAY") {
    return slot.axisWeekday
      ? { axisType: "WEEKDAY", weekday: slot.axisWeekday }
      : null;
  }

  const day = axisDateToCalendarDay(slot.axisDate);
  return day ? { axisType: "DATE", startDay: day, endDay: day } : null;
}

/** A stable string key for grouping and sorting spans. */
export function axisSpanKey(span: AxisSpan): string {
  return span.axisType === "WEEKDAY" ? span.weekday : span.startDay;
}

/**
 * Continue `span` with `next` when they are adjacent on the same axis, or null
 * when they are not. Callers merging consecutive slots use the null to start a
 * new range.
 */
export function extendAxisSpan(
  span: AxisSpan,
  next: AxisSpan,
): AxisSpan | null {
  if (span.axisType === "WEEKDAY" || next.axisType === "WEEKDAY") {
    if (span.axisType !== next.axisType) return null;
    return span.weekday === next.weekday ? span : null;
  }

  if (next.startDay !== next.endDay) return null;
  if (next.startDay === span.endDay) return span;
  if (next.startDay !== addCalendarDays(span.endDay, 1)) return null;

  return { axisType: "DATE", startDay: span.startDay, endDay: next.endDay };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/axisSpan`
Expected: PASS, 10 tests.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
for tz in America/New_York Pacific/Kiritimati Asia/Taipei UTC; do TZ=$tz npx jest lib/axisSpan; done
git add frontend/lib/axisSpan.ts frontend/lib/axisSpan.test.ts
git commit -m "feat(frontend): add AxisSpan, a discriminated axis position

An axis position is a weekday or a calendar day. It has travelled as
startDate: string plus a sibling axisType, which let a weekday occupy a
field named startDate and fall into the date formatter. Tying the payload
to the discriminant makes that unrepresentable.

No consumers yet.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task A2: formatLocalizedRangeLabel consumes AxisSpan

Changing the formatter and its four callers together: a reviewer cannot approve one without the others, because the parameter shape changes.

**Files:**
- Modify: `frontend/components/eventCommon/timeRangeFormat.ts` (the exported `formatLocalizedRangeLabel`, currently around line 188)
- Modify: `frontend/components/hostedEvent/hostedEventResultText.ts:17`
- Modify: `frontend/components/hostedEvent/HostedEventPanelPage/EventTimeSelector.tsx:190`
- Modify: `frontend/lib/line-flex-message/hostedEventResultFlexMessage.ts:98`
- Modify: `frontend/components/eventCommon/confirmed-time-formatters.ts:65`
- Test: `frontend/components/eventCommon/timeRangeFormat.test.ts`

**Interfaces:**
- Consumes: `AxisSpan` from Task A1.
- Produces: `formatLocalizedRangeLabel(range: AxisSpan & { startMinute: number; endMinute: number }, locale: string, options?: LocalizedTimeRangeFormatOptions): string`.

- [ ] **Step 1: Write the failing test**

Replace the two `formatLocalizedRangeLabel` cases in `frontend/components/eventCommon/timeRangeFormat.test.ts` with:

```typescript
import { describe, expect, it } from "@jest/globals";
import { formatLocalizedRangeLabel } from "@/components/eventCommon/timeRangeFormat";
import { calendarDay } from "@/lib/calendarDay";

describe("timeRangeFormat", () => {
  it("renders a multi-day date range", () => {
    expect(
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDay: calendarDay("2026-06-13"),
          endDay: calendarDay("2026-06-14"),
          startMinute: 1230,
          endMinute: 1410,
        },
        "zh-TW",
        { timeZone: "Asia/Taipei" },
      ),
    ).toBe("6/13（六） - 6/14（日） 20:30 - 23:30");
  });

  // Candidate days are naive: the label must read the stored digits rather
  // than re-projecting them through the viewer's or the event's zone.
  it("keeps a date span on its stored day in every event zone", () => {
    const label = (timeZone: string) =>
      formatLocalizedRangeLabel(
        {
          axisType: "DATE",
          startDay: calendarDay("2026-07-30"),
          endDay: calendarDay("2026-07-30"),
          startMinute: 600,
          endMinute: 660,
        },
        "en-US",
        { timeZone },
      );

    expect(label("America/New_York")).toBe("7/30 (Thu) 10:00 - 11:00");
    expect(label("Pacific/Honolulu")).toBe("7/30 (Thu) 10:00 - 11:00");
    expect(label("Asia/Taipei")).toBe("7/30 (Thu) 10:00 - 11:00");
    expect(label("UTC")).toBe("7/30 (Thu) 10:00 - 11:00");
  });

  it("renders a weekday span", () => {
    expect(
      formatLocalizedRangeLabel(
        {
          axisType: "WEEKDAY",
          weekday: "MONDAY",
          startMinute: 600,
          endMinute: 720,
        },
        "en-US",
      ),
    ).toBe("(Mon) 10:00 - 12:00");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/eventCommon/timeRangeFormat`
Expected: FAIL — `startDay` does not exist on the parameter type; `weekday` does not exist.

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/eventCommon/timeRangeFormat.ts`, replace the exported `formatLocalizedRangeLabel` with:

```typescript
// Dispatch a range to the formatter matching its axis. The union narrows on
// axisType, so the weekday payload can no longer reach the date formatter and
// the `as Weekday` cast this used to need is gone.
export function formatLocalizedRangeLabel(
  range: AxisSpan & { startMinute: number; endMinute: number },
  locale: string,
  options: LocalizedTimeRangeFormatOptions = {},
) {
  if (range.axisType === "WEEKDAY") {
    return formatLocalizedWeekdayTimeRangeLabel(
      {
        weekday: range.weekday,
        startMinute: range.startMinute,
        endMinute: range.endMinute,
      },
      locale,
      options,
    );
  }

  return formatLocalizedDateMinuteRangeLabel(
    {
      startDate: range.startDay,
      endDate: range.endDay,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
    },
    locale,
    options,
  );
}
```

Add `import type { AxisSpan } from "@/lib/axisSpan";` to the imports. Delete `Weekday` from the `@/types/event` import if nothing else in the file uses it.

- [ ] **Step 4: Update the four callers**

`frontend/components/hostedEvent/hostedEventResultText.ts`, in `buildRangeLabel`:

```typescript
  return formatLocalizedRangeLabel(
    { ...range.axis, startMinute: range.startMinute, endMinute: range.endMinute },
    locale,
    { timeZone },
  );
```

`frontend/components/hostedEvent/HostedEventPanelPage/EventTimeSelector.tsx`:

```tsx
                  {formatLocalizedRangeLabel(
                    {
                      ...range.axis,
                      startMinute: range.startTime,
                      endMinute: range.endTime,
                    },
                    locale,
                    { timeZone },
                  )}
```

`frontend/lib/line-flex-message/hostedEventResultFlexMessage.ts`:

```typescript
  const slotLabel = formatLocalizedRangeLabel(
    {
      ...params.range.axis,
      startMinute: params.range.startMinute,
      endMinute: params.range.endMinute,
    },
    params.locale,
    { timeZone: params.timeZone },
  );
```

`frontend/components/eventCommon/confirmed-time-formatters.ts`, in `formatWeekdayConfirmedSelection`:

```typescript
  return formatLocalizedRangeLabel(
    {
      axisType: "WEEKDAY",
      weekday: selection.weekday,
      startMinute: selection.startMinute,
      endMinute: selection.endMinute,
    },
    locale,
  );
```

The three `range.axis` references depend on Tasks A3–A4. Until those land, add the adapter at each call site instead — for example in `hostedEventResultText.ts`:

```typescript
  const axis: AxisSpan =
    range.axisType === "WEEKDAY"
      ? { axisType: "WEEKDAY", weekday: range.startDate as Weekday }
      : {
          axisType: "DATE",
          startDay: calendarDay(range.startDate),
          endDay: calendarDay(range.endDate),
        };
```

Mark each adapter `// TEMPORARY: removed in Task A3/A4 when the producer emits AxisSpan.` so the follow-up task can find them by grep.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest`
Expected: PASS, all suites.

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
git add -A frontend
git commit -m "refactor(frontend): dispatch range labels on AxisSpan

formatLocalizedRangeLabel decided whether a range was a weekday by testing
startDate === endDate, a heuristic rather than a check: a weekday range whose
ends differed fell into the date formatter. Narrowing on the union removes
both the heuristic and the unchecked \`as Weekday\`.

Producers still carry the old triple, so the four callers build the span at
the call site. Those adapters are marked TEMPORARY and removed in the tasks
that migrate each producer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task A3: resultSummary produces AxisSpan

**Files:**
- Modify: `frontend/components/hostedEvent/resultSummary.ts` (`HostedResultSlot`, `MergedConfirmedRange:14`, `HostedResultSummaryRange:39`, `getSlotAxisKey:54`, `sortSlots:62`, the merge loop at `:95`, the summary map at `:218`)
- Modify: `frontend/components/hostedEvent/hostedEventResultText.ts` — delete the temporary adapter
- Modify: `frontend/lib/line-flex-message/hostedEventResultFlexMessage.ts` — delete the temporary adapter
- Test: `frontend/components/hostedEvent/hostedEventResultText.test.ts`

**Interfaces:**
- Consumes: `AxisSpan`, `axisSpanOfSlot`, `axisSpanKey`, `extendAxisSpan` from Task A1.
- Produces: `HostedResultSummaryRange` gains `axis: AxisSpan` and loses `axisType`, `startDate`, `endDate`.

- [ ] **Step 1: Write the failing test**

In `frontend/components/hostedEvent/hostedEventResultText.test.ts`, change the one-time fixture's range from the triple to the span:

```typescript
          {
            axis: {
              axisType: "DATE",
              startDay: calendarDay("2026-06-13"),
              endDay: calendarDay("2026-06-14"),
            },
            startMinute: 1230,
            endMinute: 1410,
            availableCount: 1,
            unavailableParticipants: [],
          },
```

and the weekday fixture in the first test to:

```typescript
          {
            axis: { axisType: "WEEKDAY", weekday: "MONDAY" },
            startMinute: 600,
            endMinute: 720,
            availableCount: 1,
            unavailableParticipants: [{ name: "Alex" }],
          },
```

Add `import { calendarDay } from "@/lib/calendarDay";`. Both expectations are unchanged: `"1. 6/13（六） - 6/14（日） 20:30 - 23:30"` and `"1. (Mon) 10:00 - 12:00"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest hostedEventResultText`
Expected: FAIL — `axis` does not exist on `HostedResultSummaryRange`.

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/hostedEvent/resultSummary.ts`:

```typescript
type MergedConfirmedRange = {
  axis: AxisSpan;
  startMinute: number;
  endMinute: number;
  slotIds: string[];
};

export type HostedResultSummaryRange = {
  axis: AxisSpan;
  startMinute: number;
  endMinute: number;
  availableCount: number;
  unavailableParticipants: HostedResultSummaryParticipant[];
};
```

Delete the local `getSlotAxisKey` and call `axisSpanOfSlot(slot)` instead. In `sortSlots`, replace the two `getSlotAxisKey` calls with `axisSpanOfSlot(...)` and compare `axisSpanKey(...)`. Replace the merge loop body:

```typescript
  sortSlots(slots).forEach((slot) => {
    const span = axisSpanOfSlot(slot);
    if (!span) return;

    const current = merged[merged.length - 1];
    const extended = current && extendAxisSpan(current.axis, span);

    if (current && extended && current.endMinute === slot.startMinute) {
      current.axis = extended;
      current.endMinute = slot.endMinute;
      current.slotIds.push(slot.id);
      return;
    }

    merged.push({
      axis: span,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      slotIds: [slot.id],
    });
  });
```

At `:218`, map `axis: range.axis` in place of the `startDate`/`endDate`/`axisType` triple.

- [ ] **Step 4: Delete the temporary adapters**

Run `grep -rn "TEMPORARY: removed in Task A3" frontend` and delete each adapter, passing `{ ...range.axis, startMinute, endMinute }` directly.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest`
Expected: PASS, all suites.

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
for tz in America/New_York Pacific/Kiritimati Asia/Taipei UTC; do TZ=$tz npx jest; done
git add -A frontend
git commit -m "refactor(frontend): carry AxisSpan through the hosted result summary

The merge loop compared endDate against a bare string key and the summary
range restated axisType beside it. extendAxisSpan owns adjacency now, so a
weekday range cannot grow a second end and the summary cannot disagree with
the slots it came from.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task A4: SelectedTimeRange carries AxisSpan

**Files:**
- Modify: `frontend/components/hostedEvent/HostedEventPanelPage/types.ts:12`
- Modify: `frontend/components/hostedEvent/HostedEventPanelPage/hooks/useEventTimeSelection.ts` (`getSlotDateKey:27`, range building from `:87`)
- Modify: `frontend/components/hostedEvent/HostedEventPanelPage/EventTimeSelector.tsx` — delete the temporary adapter
- Test: `frontend/components/hostedEvent/HostedEventPanelPage/hooks/useEventTimeSelection.test.ts` (create if absent)

**Interfaces:**
- Consumes: `AxisSpan`, `axisSpanOfSlot`, `extendAxisSpan` from Task A1.
- Produces: `SelectedTimeRange` gains `axis: AxisSpan` and loses `axisType`, `startDate`, `endDate`.

- [ ] **Step 1: Write the failing test**

`useEventTimeSelection` is a hook, and this repo cannot render components in tests. Export the pure range builder it calls (currently the unexported function at `:87`) as `buildSelectedRanges` and test that directly.

Create `frontend/components/hostedEvent/HostedEventPanelPage/hooks/useEventTimeSelection.test.ts`:

```typescript
import { describe, expect, it } from "@jest/globals";
import { buildSelectedRanges } from "./useEventTimeSelection";

const options = {
  idPrefix: "sel",
  isConfirmed: false,
  isStaged: false,
  isToBeRemoved: false,
};

describe("buildSelectedRanges", () => {
  it("merges contiguous slots on one day into a single date span", () => {
    const ranges = buildSelectedRanges(
      [
        {
          id: "a",
          axisType: "DATE",
          axisDate: "2026-07-30T00:00:00.000Z",
          startMinute: 600,
          endMinute: 630,
        },
        {
          id: "b",
          axisType: "DATE",
          axisDate: "2026-07-30T00:00:00.000Z",
          startMinute: 630,
          endMinute: 660,
        },
      ],
      options,
    );

    expect(ranges).toHaveLength(1);
    expect(ranges[0].axis).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-30",
    });
    expect(ranges[0].endTime).toBe(660);
  });

  it("keeps two weekdays as separate spans", () => {
    const ranges = buildSelectedRanges(
      [
        {
          id: "a",
          axisType: "WEEKDAY",
          axisWeekday: "MONDAY",
          startMinute: 600,
          endMinute: 630,
        },
        {
          id: "b",
          axisType: "WEEKDAY",
          axisWeekday: "TUESDAY",
          startMinute: 630,
          endMinute: 660,
        },
      ],
      options,
    );

    expect(ranges.map((range) => range.axis)).toEqual([
      { axisType: "WEEKDAY", weekday: "MONDAY" },
      { axisType: "WEEKDAY", weekday: "TUESDAY" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest useEventTimeSelection`
Expected: FAIL — `buildSelectedRanges` is not exported.

- [ ] **Step 3: Write minimal implementation**

In `types.ts`:

```typescript
export interface SelectedTimeRange {
  id: string;
  axis: AxisSpan;
  startTime: number;
  endTime: number;
  slotIds: string[];
  isConfirmed?: boolean;
  isStaged?: boolean;
  isToBeRemoved?: boolean;
}
```

In `useEventTimeSelection.ts`, delete `getSlotDateKey`, export the range builder as `buildSelectedRanges`, and replace the merge body with the `axisSpanOfSlot` / `extendAxisSpan` pair used in Task A3 — merging when `extendAxisSpan` returns non-null and `currentRange.endTime === slot.startMinute`.

- [ ] **Step 4: Delete the temporary adapter**

Run `grep -rn "TEMPORARY: removed in Task A4" frontend` and delete it from `EventTimeSelector.tsx`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest`
Expected: PASS, all suites.

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
git add -A frontend
git commit -m "refactor(frontend): carry AxisSpan through hosted panel selection

The range builder is exported so it can be tested without rendering: this
repo has no jsdom, and the merge rule is the part worth pinning.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task A5: Grid columns become a discriminated union

**Files:**
- Modify: `frontend/components/eventCommon/timeGrid/types.ts:10` (`GridAxisColumn`)
- Modify: `frontend/components/eventCommon/timeGrid/utils.ts` (`formatAxisHeader:20`, `formatAxisPageRange:38`, `formatDatePageValue:62`, `getSlotAxisKey:91`, `buildAxisColumns:67`, `groupSlotsByAxis:131`, `sortAxisKeys:104`)
- Modify: `frontend/lib/event-presentation.ts:76` (`formatAxisKeyLabel`)
- Test: `frontend/components/eventCommon/timeGrid/utils.test.ts`, `frontend/lib/event-presentation.test.ts`

**Interfaces:**
- Consumes: `AxisSpan`, `axisSpanOfSlot`, `axisSpanKey` from Task A1.
- Produces: `GridAxisColumn = { key: string; axis: AxisSpan }`; `formatAxisKeyLabel(span: AxisSpan, locale: string): string`.

- [ ] **Step 1: Write the failing test**

Append to `frontend/lib/event-presentation.test.ts`:

```typescript
describe("formatAxisKeyLabel", () => {
  it("labels a date span with its month and day", () => {
    expect(
      formatAxisKeyLabel(
        {
          axisType: "DATE",
          startDay: calendarDay("2026-07-30"),
          endDay: calendarDay("2026-07-30"),
        },
        "en-US",
      ),
    ).toBe("7/30");
  });

  it("labels a weekday span with its weekday name", () => {
    expect(
      formatAxisKeyLabel({ axisType: "WEEKDAY", weekday: "MONDAY" }, "en-US"),
    ).toBe("Mon");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/event-presentation`
Expected: FAIL — `formatAxisKeyLabel` still takes `(axisKey: string, axisType, locale)`.

- [ ] **Step 3: Write minimal implementation**

In `frontend/components/eventCommon/timeGrid/types.ts`:

```typescript
export interface GridAxisColumn {
  /** Stable key for grouping and lookup; see axisSpanKey. */
  key: string;
  axis: AxisSpan;
}
```

`kind`, `rawValue` and `axisWeekday` are gone. `kind` used the lowercase spelling `"date" | "weekday"`, a fifth spelling of a discriminant the schema already defines as `"DATE" | "WEEKDAY"`.

In `frontend/lib/event-presentation.ts`:

```typescript
export function formatAxisKeyLabel(span: AxisSpan, locale: string): string {
  if (span.axisType === "WEEKDAY") {
    return formatWeekdayLabel(span.weekday, locale);
  }

  // Grid headers read these back with local getters, so the day is anchored at
  // local noon rather than UTC midnight.
  const date = parseCalendarDayValue(span.startDay);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
```

In `utils.ts`, delete `getSlotAxisKey` in favour of `axisSpanOfSlot`; `groupSlotsByAxis` keys on `axisSpanKey(span)`; `buildAxisColumns` returns `{ key, axis }`; `formatAxisHeader` and `formatAxisPageRange` narrow on `column.axis.axisType`. `formatAxisPageRange`'s guard becomes a single check on the start column, since a grid is never mixed-kind and the union now says so — the old `&&` across both columns was the weaker guard.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest`
Expected: PASS, all suites.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
for tz in America/New_York Pacific/Kiritimati Asia/Taipei UTC; do TZ=$tz npx jest; done
git add -A frontend
git commit -m "refactor(frontend): make grid axis columns a discriminated union

GridAxisColumn carried kind plus an optional axisWeekday, so every reader
double-checked both and the lowercase kind was a fifth spelling of a
discriminant the schema defines as DATE | WEEKDAY.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task A6: Results selection drops the column lookup

**Files:**
- Modify: `frontend/components/eventCommon/timeGrid/ResultsView/hooks/useResultsRangeSelection.ts:19` (`SelectionRange`), `buildRangeFromBounds:116`
- Modify: `frontend/components/eventCommon/timeGrid/ResultsView/ResultsHeatmapGrid.tsx` (`formatDateForModal:209`, `showModalForSelection:222`)
- Modify: `frontend/components/eventCommon/timeGrid/ResultsView/types.ts:8`
- Test: `frontend/components/eventCommon/timeGrid/ResultsView/hooks/useResultsRangeSelection.test.ts` (create)

**Interfaces:**
- Consumes: `AxisSpan`, `extendAxisSpan` from Task A1; `GridAxisColumn` from Task A5.
- Produces: `SelectionRange` gains `axis: AxisSpan` and loses `startDate`, `endDate`.

`SelectionRange` is the one range type with no `axisType` at all: `ResultsHeatmapGrid` recovered the kind with `columnsByKey.get(range.startDate)?.kind === "weekday"`, the third of the three mechanisms. Carrying the span removes that lookup.

- [ ] **Step 1: Write the failing test**

Export the pure `buildRangeFromBounds` body as `buildSelectionRange(columns: GridAxisColumn[], bounds, rows)` so it is testable without rendering, then create the test:

```typescript
import { describe, expect, it } from "@jest/globals";
import { buildSelectionRange } from "./useResultsRangeSelection";
import { calendarDay } from "@/lib/calendarDay";

const columns = [
  {
    key: "2026-07-30",
    axis: {
      axisType: "DATE" as const,
      startDay: calendarDay("2026-07-30"),
      endDay: calendarDay("2026-07-30"),
    },
  },
  {
    key: "2026-07-31",
    axis: {
      axisType: "DATE" as const,
      startDay: calendarDay("2026-07-31"),
      endDay: calendarDay("2026-07-31"),
    },
  },
];

const rows = [{ startMinute: 600, endMinute: 630, slotIndices: [0] }];

describe("buildSelectionRange", () => {
  it("spans the selected columns", () => {
    const range = buildSelectionRange(columns, rows, {
      minDate: 0,
      maxDate: 1,
      minRow: 0,
      maxRow: 0,
    });

    expect(range?.axis).toEqual({
      axisType: "DATE",
      startDay: "2026-07-30",
      endDay: "2026-07-31",
    });
  });

  it("returns null when the selection covers no cells", () => {
    expect(
      buildSelectionRange([], rows, {
        minDate: 0,
        maxDate: 0,
        minRow: 0,
        maxRow: 0,
      }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest useResultsRangeSelection`
Expected: FAIL — `buildSelectionRange` is not exported.

- [ ] **Step 3: Write minimal implementation**

```typescript
export interface SelectionRange {
  cells: Array<{ dateKey: string; rowIndex: number; slotIndices: number[] }>;
  axis: AxisSpan;
  startTime: number;
  endTime: number;
}
```

`buildSelectionRange` folds the selected columns' spans with `extendAxisSpan`, returning null if any fold fails. In `ResultsHeatmapGrid`, `formatDateForModal` takes an `AxisSpan` and calls `formatAxisKeyLabel(span, locale)`; `showModalForSelection` builds its `dateLabel` from `range.axis` and passes `axis: range.axis` into `rangeInfo`, deleting the `columnsByKey` kind lookup.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest`
Expected: PASS, all suites.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
git add -A frontend
git commit -m "refactor(frontend): carry AxisSpan through results selection

SelectionRange had no axisType, so the heatmap recovered the kind by looking
the start key up in columnsByKey. That was the last of the three mechanisms
answering whether an axis is a weekday.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task A7: Confirm the union is the only mechanism left

**Files:**
- Modify: none expected. This task is a check that fails loudly if A2–A6 missed a site.

- [ ] **Step 1: Grep for the retired shapes**

```bash
cd frontend
grep -rn "axisType" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v generated | grep -vE "axisSpan|AxisSpan|EventSlotAxisType|axisType: \"(DATE|WEEKDAY)\""
grep -rn "startDate === endDate\|=== range.endDate\|columnsByKey.get" --include=*.ts --include=*.tsx . | grep -v node_modules
grep -rn "TEMPORARY: removed in Task" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Expected: no output from any of the three. Any hit is a site A2–A6 missed; fix it in the task it belonged to and re-run.

- [ ] **Step 2: Confirm the bad state is unrepresentable**

Write this file, run `npx tsc --noEmit`, confirm both lines error, then delete it:

```typescript
// frontend/__probe_tmp.ts
import type { AxisSpan } from "@/lib/axisSpan";

// A weekday span with two ends
const a: AxisSpan = { axisType: "WEEKDAY", weekday: "MONDAY", endDay: "x" };
// A date span with no days
const b: AxisSpan = { axisType: "DATE" };

export { a, b };
```

- [ ] **Step 3: Full verification**

```bash
npx tsc --noEmit && npx eslint . && npx jest
for tz in America/New_York Pacific/Kiritimati Asia/Taipei UTC; do TZ=$tz npx jest; done
```

---

# Part B — Time module layout

**Do not start until Part A is merged.**

Part B moves files and changes no behaviour. Every task is `git mv` plus import updates, and the test suite must stay at the same count throughout.

### Task B1: formatMinutesToTime leaves lib/utils.ts

`lib/utils.ts` is imported by 32 files, almost all for `cn()`. `formatMinutesToTime` has 5 caller files and no relationship to class merging.

**Files:**
- Create: `frontend/lib/time/minuteOfDay.ts`, `frontend/lib/time/minuteOfDay.test.ts`
- Modify: `frontend/lib/utils.ts`; the 5 callers: `components/eventCommon/eventInformation/EventConfigurationSummary.tsx`, `components/eventCommon/timeGrid/VotingGrid/index.tsx`, `components/eventCommon/timeGrid/ui/TimeColumn.tsx`, `components/eventCommon/timeRangeFormat.ts`, `components/eventCommon/timeGrid/ResultsView/ResultsHeatmapGrid.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/lib/time/minuteOfDay.test.ts
import { describe, expect, it } from "@jest/globals";
import { formatMinutesToTime } from "@/lib/time/minuteOfDay";

describe("formatMinutesToTime", () => {
  it("pads to HH:mm", () => {
    expect(formatMinutesToTime(0)).toBe("00:00");
    expect(formatMinutesToTime(570)).toBe("09:30");
    expect(formatMinutesToTime(1439)).toBe("23:59");
  });

  // Slot end boundaries are expressed as 1440 rather than rolling to 00:00.
  it("renders the end-of-day boundary as 24:00", () => {
    expect(formatMinutesToTime(1440)).toBe("24:00");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/time/minuteOfDay`
Expected: FAIL — `Cannot find module '@/lib/time/minuteOfDay'`.

- [ ] **Step 3: Move the function**

Create `frontend/lib/time/minuteOfDay.ts` with the body currently in `lib/utils.ts`, keeping the existing doc comment. Delete it from `lib/utils.ts`, which then holds only `cn()`. Update the 5 imports to `@/lib/time/minuteOfDay`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest`
Expected: PASS, suite count unchanged plus one new suite.

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
git add -A frontend
git commit -m "refactor(frontend): move formatMinutesToTime out of lib/utils

lib/utils is imported by 32 files for cn(). A minute-of-day formatter has no
relationship to class merging and five callers.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task B2: lib/time/ gathers the primitives

**Files:**
- Move: `lib/time.ts` → `lib/time/zone.ts`; `lib/calendarDay.ts` → `lib/time/calendarDay.ts`; `lib/wallClock.ts` → `lib/time/wallClock.ts`, with their tests alongside
- Create: `frontend/lib/time/index.ts`

- [ ] **Step 1: Move the files**

```bash
cd frontend
mkdir -p lib/time
git mv lib/time.ts lib/time/zone.ts
git mv lib/time.test.ts lib/time/zone.test.ts
git mv lib/calendarDay.ts lib/time/calendarDay.ts
git mv lib/calendarDay.test.ts lib/time/calendarDay.test.ts
git mv lib/wallClock.ts lib/time/wallClock.ts
git mv lib/wallClock.test.ts lib/time/wallClock.test.ts
```

- [ ] **Step 2: Create the barrel**

```typescript
// frontend/lib/time/index.ts
// Primitives for naive time. Nothing here names an event, a deadline or a
// slot — product labels live in lib/event-time.
export * from "./calendarDay";
export * from "./minuteOfDay";
export * from "./wallClock";
export * from "./zone";
```

- [ ] **Step 3: Update every import**

```bash
cd frontend
grep -rl '@/lib/\(time\|calendarDay\|wallClock\)"' --include=*.ts --include=*.tsx . \
  | grep -v node_modules \
  | xargs perl -pi -e 's{\@/lib/(time|calendarDay|wallClock)"}{\@/lib/time"}g'
```

Then fix the two intra-module imports by hand: `lib/time/calendarDay.ts` imports from `./zone`, and `lib/time/wallClock.ts` imports from `./calendarDay` and `./zone` — they must not go through the barrel, which would make the module cycle a runtime one.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS, same test count as before the move.

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
for tz in America/New_York Pacific/Kiritimati Asia/Taipei UTC; do TZ=$tz npx jest; done
git add -A frontend
git commit -m "refactor(frontend): gather naive-time primitives under lib/time

File moves and import updates only. Intra-module imports stay relative so the
calendarDay/zone cycle remains type-level.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task B3: lib/event-time/ gathers the product labels

Two label modules currently live under `components/eventCommon/` despite having no JSX and being imported by `lib/line-flex-message/`.

**Files:**
- Move: `components/eventCommon/timeRangeFormat.ts` → `lib/event-time/rangeLabel.ts`; `components/eventCommon/confirmed-time-formatters.ts` → `lib/event-time/confirmed.ts`; `lib/votingDeadline.ts` → `lib/event-time/votingDeadline.ts`; `lib/weekdays.ts` → `lib/event-time/weekdays.ts`, with their tests
- Create: `frontend/lib/event-time/index.ts`

- [ ] **Step 1: Move the files**

```bash
cd frontend
mkdir -p lib/event-time
git mv components/eventCommon/timeRangeFormat.ts lib/event-time/rangeLabel.ts
git mv components/eventCommon/timeRangeFormat.test.ts lib/event-time/rangeLabel.test.ts
git mv components/eventCommon/confirmed-time-formatters.ts lib/event-time/confirmed.ts
git mv components/eventCommon/confirmed-time-formatters.test.ts lib/event-time/confirmed.test.ts
git mv lib/votingDeadline.ts lib/event-time/votingDeadline.ts
git mv lib/votingDeadline.test.ts lib/event-time/votingDeadline.test.ts
git mv lib/weekdays.ts lib/event-time/weekdays.ts
```

- [ ] **Step 2: Create the barrel**

```typescript
// frontend/lib/event-time/index.ts
// Product labels: these name events, deadlines and slots. Primitives live in
// lib/time.
export * from "./confirmed";
export * from "./rangeLabel";
export * from "./votingDeadline";
export * from "./weekdays";
```

- [ ] **Step 3: Update every import**

```bash
cd frontend
grep -rl '@/components/eventCommon/\(timeRangeFormat\|confirmed-time-formatters\)"\|@/lib/\(votingDeadline\|weekdays\)"' \
  --include=*.ts --include=*.tsx . | grep -v node_modules \
  | xargs perl -pi -e 's{\@/components/eventCommon/(timeRangeFormat|confirmed-time-formatters)"}{\@/lib/event-time"}g; s{\@/lib/(votingDeadline|weekdays)"}{\@/lib/event-time"}g'
```

`ConfirmedTimeDisplay.tsx` and `ConfirmedView.tsx` use the relative form `"./confirmed-time-formatters"` — fix those two by hand. Then make the intra-module imports relative, as in Task B2.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS, same test count as before the move.

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit && npx eslint . && npx jest
git add -A frontend
git commit -m "refactor(frontend): gather event time labels under lib/event-time

timeRangeFormat and confirmed-time-formatters contain no JSX and are imported
by lib/line-flex-message; they were under components only by accident.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage.** The discriminated union is Tasks A1–A7; every one of the three kind-detection mechanisms named in the Background has a task that removes it (A2 the `startDate === endDate` heuristic, A5 the `GridAxisColumn.kind` pairing and the slot-level helpers, A6 the `columnsByKey` lookup), and A7 checks by grep that none survive. The `lib/` arrangement is Tasks B1–B3 and covers every module in the File Structure map.

**Placeholder scan.** No TBDs. Task A2's caller adapters are the one place the plan describes a temporary construct — the code is given, and A3/A4 each carry an explicit grep step to remove them.

**Type consistency.** `AxisSpan`'s discriminant is `axisType` throughout, with values `"DATE"`/`"WEEKDAY"` matching `EventSlotAxisType`. The date payload is `startDay`/`endDay` in every task — deliberately not `startDate`/`endDate`, so the compiler flags any site still on the old shape rather than silently accepting it. `axisSpanOfSlot`, `axisSpanKey` and `extendAxisSpan` keep those names in A3–A6. The field carrying a span on a range type is `axis` in all four.

**Known gap.** Task A4's test requires exporting `buildSelectedRanges`, and A6's requires exporting `buildSelectionRange`. Both are currently closures inside hooks. If either turns out to capture hook state that cannot be passed as an argument, extract the pure part into a sibling `.ts` module rather than widening the hook's signature.
