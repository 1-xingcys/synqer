-- CreateTable
CREATE TABLE "EventStagedConfirmation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slotIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baselineSlotIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventStagedConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventStagedConfirmation_eventId_key" ON "EventStagedConfirmation"("eventId");

-- CreateIndex
CREATE INDEX "EventStagedConfirmation_eventId_idx" ON "EventStagedConfirmation"("eventId");

-- AddForeignKey
ALTER TABLE "EventStagedConfirmation" ADD CONSTRAINT "EventStagedConfirmation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
