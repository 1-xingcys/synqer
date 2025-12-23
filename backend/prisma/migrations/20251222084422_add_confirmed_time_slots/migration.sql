/*
  Warnings:

  - You are about to drop the column `confirmedEndTime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedStartTime` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "confirmedEndTime",
DROP COLUMN "confirmedStartTime";

-- CreateTable
CREATE TABLE "ConfirmedEventTimeSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfirmedEventTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConfirmedEventTimeSlot_eventId_idx" ON "ConfirmedEventTimeSlot"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmedEventTimeSlot_eventId_slotId_key" ON "ConfirmedEventTimeSlot"("eventId", "slotId");

-- CreateIndex
CREATE INDEX "Event_ownerId_idx" ON "Event"("ownerId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmedEventTimeSlot" ADD CONSTRAINT "ConfirmedEventTimeSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfirmedEventTimeSlot" ADD CONSTRAINT "ConfirmedEventTimeSlot_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "EventTimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
