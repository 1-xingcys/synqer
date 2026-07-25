-- CreateEnum
CREATE TYPE "EventVoteMode" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "defaultGranularityMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "defaultVoteMode" "EventVoteMode" NOT NULL DEFAULT 'AVAILABLE';
