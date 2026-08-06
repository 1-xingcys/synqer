import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Vote data access layer
 */
@Injectable()
export class VoteRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find the voting-related fields of an event
   */
  async findEventVotingInfo(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        votingDeadline: true,
        isDeleted: true,
        timeZone: true,
      },
    });
  }

  /**
   * Find a user's hasVoted status for an event
   */
  async findParticipantVoteStatus(eventId: string, userId: string) {
    return this.prisma.eventExpectedParticipant.findFirst({
      where: {
        eventId,
        userId,
        isRemoved: false,
      },
      select: {
        hasVoted: true,
      },
    });
  }

  /**
   * Find the available slot IDs a user has already committed
   */
  async findUserCommittedSlotIds(
    eventId: string,
    userId: string,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    const rows = await client.eventVote.findMany({
      where: {
        eventId,
        userId,
      },
      select: {
        slotId: true,
      },
    });
    return rows.map((row) => row.slotId);
  }

  /**
   * Find a user's current staged draft
   */
  async findUserStagedVote(
    eventId: string,
    userId: string,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventStagedVote.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      select: {
        slotIds: true,
        baselineSlotIds: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Make read, apply-delta and write of one voter's staged draft a single
   * critical section.
   *
   * This is a read-modify-write and the upsert replaces the whole slotIds
   * array, so two PATCHes in flight at once both read the same pre-write row
   * and the later write drops the earlier one's slots. The advisory lock is
   * transaction-scoped: Postgres releases it when the transaction ends,
   * including on rollback.
   */
  async runInStagedVoteLock<T>(
    eventId: string,
    userId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`staged-vote:${eventId}:${userId}`}, 0))`;
      return fn(tx);
    });
  }

  /**
   * Upsert a staged draft
   */
  async upsertStagedVote(
    eventId: string,
    userId: string,
    slotIds: string[],
    baselineSlotIds: string[],
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventStagedVote.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: {
        eventId,
        userId,
        slotIds,
        baselineSlotIds,
      },
      update: {
        slotIds,
        baselineSlotIds,
      },
    });
  }

  /**
   * Delete a staged draft
   */
  async deleteStagedVote(
    eventId: string,
    userId: string,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventStagedVote.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  }

  /**
   * Delete every vote a user cast in an event
   */
  async deleteUserVotes(
    eventId: string,
    userId: string,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventVote.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  }

  /**
   * Create vote rows in bulk
   */
  async createVotes(
    eventId: string,
    userId: string,
    slotIds: string[],
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventVote.createMany({
      data: slotIds.map((slotId) => ({
        eventId,
        slotId,
        userId,
      })),
    });
  }

  /**
   * Update an expected participant's vote status
   */
  async updateParticipantVoteStatus(
    eventId: string,
    userId: string,
    hasVoted: boolean,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventExpectedParticipant.updateMany({
      where: {
        eventId,
        userId,
      },
      data: {
        hasVoted,
      },
    });
  }

  /**
   * Run the whole vote flow in a transaction
   */
  async submitVoteInTransaction(
    eventId: string,
    userId: string,
    availableSlotIds: string[],
  ) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 1. Drop this user's previous votes for the event
        await this.deleteUserVotes(eventId, userId, prisma);

        // 2. Create the new vote rows (the slots they are available for)
        if (availableSlotIds.length > 0) {
          await this.createVotes(eventId, userId, availableSlotIds, prisma);
        }

        // 3. Update hasVoted on EventExpectedParticipant
        await this.updateParticipantVoteStatus(eventId, userId, true, prisma);

        return { availableSlotIds };
      },
    );
  }

  /**
   * Add votes incrementally
   */
  async upsertVotes(
    eventId: string,
    userId: string,
    slotIds: string[],
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    if (slotIds.length === 0) return;
    return client.eventVote.createMany({
      data: slotIds.map((slotId) => ({
        eventId,
        slotId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Delete the votes for the given slots
   */
  async deleteSpecificVotes(
    eventId: string,
    userId: string,
    slotIds: string[],
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    if (slotIds.length === 0) return;
    return client.eventVote.deleteMany({
      where: {
        eventId,
        userId,
        slotId: { in: slotIds },
      },
    });
  }

  /**
   * Run an incremental vote update in a transaction
   */
  async updateVotesInTransaction(
    eventId: string,
    userId: string,
    addSlotIds: string[],
    removeSlotIds: string[],
  ) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 1. Add votes
        if (addSlotIds.length > 0) {
          await this.upsertVotes(eventId, userId, addSlotIds, prisma);
        }

        // 2. Remove votes
        if (removeSlotIds.length > 0) {
          await this.deleteSpecificVotes(
            eventId,
            userId,
            removeSlotIds,
            prisma,
          );
        }

        // 3. Update hasVoted on EventExpectedParticipant
        await this.updateParticipantVoteStatus(eventId, userId, true, prisma);

        return { addSlotIds, removeSlotIds };
      },
    );
  }

  /**
   * Commit a staged draft into committed votes and clear the draft
   */
  async commitStagedVotesInTransaction(
    eventId: string,
    userId: string,
    availableSlotIds: string[],
  ) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        await this.deleteUserVotes(eventId, userId, prisma);

        if (availableSlotIds.length > 0) {
          await this.createVotes(eventId, userId, availableSlotIds, prisma);
        }

        await this.updateParticipantVoteStatus(eventId, userId, true, prisma);
        await this.deleteStagedVote(eventId, userId, prisma);

        return { availableSlotIds };
      },
    );
  }
}
