-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "primaryEmail" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineGroup" (
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
CREATE TABLE "LineGroupMember" (
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
CREATE TABLE "Event" (
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
    "lineGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventExpectedParticipant" (
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
CREATE TABLE "EventTimeSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "EventTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVote" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerUserId_key" ON "AuthIdentity"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LineGroup_lineGroupId_key" ON "LineGroup"("lineGroupId");

-- CreateIndex
CREATE INDEX "LineGroupMember_lineGroupId_idx" ON "LineGroupMember"("lineGroupId");

-- CreateIndex
CREATE INDEX "LineGroupMember_lineUserId_idx" ON "LineGroupMember"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LineGroupMember_lineGroupId_lineUserId_key" ON "LineGroupMember"("lineGroupId", "lineUserId");

-- CreateIndex
CREATE INDEX "Event_lineGroupId_idx" ON "Event"("lineGroupId");

-- CreateIndex
CREATE INDEX "EventExpectedParticipant_eventId_idx" ON "EventExpectedParticipant"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventExpectedParticipant_eventId_lineUserId_key" ON "EventExpectedParticipant"("eventId", "lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EventExpectedParticipant_eventId_userId_key" ON "EventExpectedParticipant"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventTimeSlot_eventId_idx" ON "EventTimeSlot"("eventId");

-- CreateIndex
CREATE INDEX "EventTimeSlot_eventId_date_idx" ON "EventTimeSlot"("eventId", "date");

-- CreateIndex
CREATE INDEX "EventVote_eventId_idx" ON "EventVote"("eventId");

-- CreateIndex
CREATE INDEX "EventVote_slotId_idx" ON "EventVote"("slotId");

-- CreateIndex
CREATE INDEX "EventVote_userId_idx" ON "EventVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventVote_eventId_slotId_userId_key" ON "EventVote"("eventId", "slotId", "userId");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineGroupMember" ADD CONSTRAINT "LineGroupMember_lineGroupId_fkey" FOREIGN KEY ("lineGroupId") REFERENCES "LineGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineGroupMember" ADD CONSTRAINT "LineGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_lineGroupId_fkey" FOREIGN KEY ("lineGroupId") REFERENCES "LineGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpectedParticipant" ADD CONSTRAINT "EventExpectedParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpectedParticipant" ADD CONSTRAINT "EventExpectedParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimeSlot" ADD CONSTRAINT "EventTimeSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVote" ADD CONSTRAINT "EventVote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVote" ADD CONSTRAINT "EventVote_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "EventTimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVote" ADD CONSTRAINT "EventVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
