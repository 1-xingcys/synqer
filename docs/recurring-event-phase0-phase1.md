# Recurring Event Phase 0-1 Contract

This document fixes the shared contract for Phase 0 and Phase 1.

## Goals

- Keep all existing one-time event behavior unchanged.
- Expand the data model so recurring event can be added later without another schema rewrite.
- Preserve all existing `Event.id` and `EventTimeSlot.id` values.
- Backfill existing one-time events into the new schedule model.

## Agreed Product Rules

- Recurring event has no `recurrenceEndDate`.
- Recurring event never enters `COMPLETED`.
- Recurring event does not support Google Calendar conflict detection.
- Recurring event does not support Add to Calendar.
- Recurring confirmed display uses `weekday + time range`.

## Architecture Decisions

- Use a single `Event` aggregate root with `Event.type`.
- Keep participant, vote, staged vote, confirmation tables shared across event types.
- Split schedule data into subtype tables:
  - `OneTimeEventSchedule`
  - `RecurringEventSchedule`
- Expand `EventTimeSlot` with axis metadata instead of rebuilding slot IDs.

## Phase 1 Scope

- Add `Event.type` with default `ONE_TIME`.
- Add schedule tables for one-time and recurring events.
- Add slot axis metadata fields:
  - `axisType`
  - `axisDate`
  - `axisWeekday`
- Backfill existing one-time events into `OneTimeEventSchedule`.
- Backfill existing time slots so all current slots are marked as `DATE` axis slots.

## Explicit Non-Goals for Phase 1

- No recurring creation flow.
- No recurring API surface.
- No frontend recurring UI.
- No change to current one-time event DTO behavior.
- No removal of legacy date-based columns yet.

## Migration Safety Rules

- Never regenerate `Event.id`.
- Never regenerate `EventTimeSlot.id`.
- Do not delete legacy columns in Phase 1.
- Backfill must be idempotent and safe to rerun.
- Backfill must support a dry-run mode.

## Planned Future Cutover

- Backend services will later read from schedule subtype tables.
- Frontend will later move from date-only grid to axis-based grid.
- Legacy `Event.startDate/endDate/...` and `EventTimeSlot.date` will be removed only after full cutover and verification.
