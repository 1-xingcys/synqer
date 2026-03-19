ALTER TABLE "Event"
DROP COLUMN "startDate",
DROP COLUMN "endDate",
DROP COLUMN "startMinuteOfDay",
DROP COLUMN "endMinuteOfDay",
DROP COLUMN "slotDurationMin";

DROP INDEX IF EXISTS "EventTimeSlot_eventId_date_idx";

ALTER TABLE "EventTimeSlot"
DROP COLUMN "date";
