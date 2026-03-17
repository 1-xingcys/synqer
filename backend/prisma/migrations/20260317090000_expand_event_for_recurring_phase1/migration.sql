-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "EventSlotAxisType" AS ENUM ('DATE', 'WEEKDAY');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "type" "EventType" NOT NULL DEFAULT 'ONE_TIME';

-- AlterTable
ALTER TABLE "EventTimeSlot"
ADD COLUMN "axisType" "EventSlotAxisType" NOT NULL DEFAULT 'DATE',
ADD COLUMN "axisDate" TIMESTAMP(3),
ADD COLUMN "axisWeekday" "Weekday";

-- CreateTable
CREATE TABLE "OneTimeEventSchedule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startMinuteOfDay" INTEGER NOT NULL,
    "endMinuteOfDay" INTEGER NOT NULL,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneTimeEventSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringEventSchedule" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "weekdays" "Weekday"[] DEFAULT ARRAY[]::"Weekday"[],
    "startMinuteOfDay" INTEGER NOT NULL,
    "endMinuteOfDay" INTEGER NOT NULL,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringEventSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OneTimeEventSchedule_eventId_key" ON "OneTimeEventSchedule"("eventId");

-- CreateIndex
CREATE INDEX "OneTimeEventSchedule_eventId_idx" ON "OneTimeEventSchedule"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringEventSchedule_eventId_key" ON "RecurringEventSchedule"("eventId");

-- CreateIndex
CREATE INDEX "RecurringEventSchedule_eventId_idx" ON "RecurringEventSchedule"("eventId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "EventTimeSlot_eventId_axisType_axisDate_idx" ON "EventTimeSlot"("eventId", "axisType", "axisDate");

-- CreateIndex
CREATE INDEX "EventTimeSlot_eventId_axisType_axisWeekday_idx" ON "EventTimeSlot"("eventId", "axisType", "axisWeekday");

-- AddForeignKey
ALTER TABLE "OneTimeEventSchedule" ADD CONSTRAINT "OneTimeEventSchedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringEventSchedule" ADD CONSTRAINT "RecurringEventSchedule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
