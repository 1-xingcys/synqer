-- AlterTable
ALTER TABLE "EventStagedVote"
ADD COLUMN "baselineSlotIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill existing drafts so legacy staged rows keep their current state as baseline
UPDATE "EventStagedVote"
SET "baselineSlotIds" = "slotIds"
WHERE "baselineSlotIds" = ARRAY[]::TEXT[];
