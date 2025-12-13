-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "confirmedEndTime" TIMESTAMP(3),
ADD COLUMN     "confirmedStartTime" TIMESTAMP(3),
ADD COLUMN     "votingDeadline" TIMESTAMP(3);
