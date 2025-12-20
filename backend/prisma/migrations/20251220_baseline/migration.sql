-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."AuthIdentity" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startMinuteOfDay" INTEGER NOT NULL,
    "endMinuteOfDay" INTEGER NOT NULL,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 15,
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Taipei',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedEndTime" TIMESTAMP(3),
    "confirmedStartTime" TIMESTAMP(3),
    "lineGroupId" TEXT,
    "votingDeadline" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventExpectedParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lineUserId" TEXT,
    "userId" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "hasVoted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventExpectedParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventTimeSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "EventTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventVote" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoogleCalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "googleEmail" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LineGroup" (
    "id" TEXT NOT NULL,
    "lineGroupId" TEXT NOT NULL,
    "groupName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "botJoinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LineGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LineGroupMember" (
    "id" TEXT NOT NULL,
    "lineGroupId" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "pictureUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "LineGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "primaryEmail" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerUserId_key" ON "public"."AuthIdentity"("provider" ASC, "providerUserId" ASC);

-- CreateIndex
CREATE INDEX "Event_lineGroupId_idx" ON "public"."Event"("lineGroupId" ASC);

-- CreateIndex
CREATE INDEX "EventExpectedParticipant_eventId_idx" ON "public"."EventExpectedParticipant"("eventId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EventExpectedParticipant_eventId_lineUserId_key" ON "public"."EventExpectedParticipant"("eventId" ASC, "lineUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EventExpectedParticipant_eventId_userId_key" ON "public"."EventExpectedParticipant"("eventId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "EventTimeSlot_eventId_date_idx" ON "public"."EventTimeSlot"("eventId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "EventTimeSlot_eventId_idx" ON "public"."EventTimeSlot"("eventId" ASC);

-- CreateIndex
CREATE INDEX "EventVote_eventId_idx" ON "public"."EventVote"("eventId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EventVote_eventId_slotId_userId_key" ON "public"."EventVote"("eventId" ASC, "slotId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "EventVote_slotId_idx" ON "public"."EventVote"("slotId" ASC);

-- CreateIndex
CREATE INDEX "EventVote_userId_idx" ON "public"."EventVote"("userId" ASC);

-- CreateIndex
CREATE INDEX "GoogleCalendarConnection_googleAccountId_idx" ON "public"."GoogleCalendarConnection"("googleAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_key" ON "public"."GoogleCalendarConnection"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LineGroup_lineGroupId_key" ON "public"."LineGroup"("lineGroupId" ASC);

-- CreateIndex
CREATE INDEX "LineGroupMember_lineGroupId_idx" ON "public"."LineGroupMember"("lineGroupId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LineGroupMember_lineGroupId_lineUserId_key" ON "public"."LineGroupMember"("lineGroupId" ASC, "lineUserId" ASC);

-- CreateIndex
CREATE INDEX "LineGroupMember_lineUserId_idx" ON "public"."LineGroupMember"("lineUserId" ASC);

-- AddForeignKey
ALTER TABLE "public"."AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_lineGroupId_fkey" FOREIGN KEY ("lineGroupId") REFERENCES "public"."LineGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventExpectedParticipant" ADD CONSTRAINT "EventExpectedParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventExpectedParticipant" ADD CONSTRAINT "EventExpectedParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTimeSlot" ADD CONSTRAINT "EventTimeSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventVote" ADD CONSTRAINT "EventVote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventVote" ADD CONSTRAINT "EventVote_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."EventTimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventVote" ADD CONSTRAINT "EventVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LineGroupMember" ADD CONSTRAINT "LineGroupMember_lineGroupId_fkey" FOREIGN KEY ("lineGroupId") REFERENCES "public"."LineGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LineGroupMember" ADD CONSTRAINT "LineGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

