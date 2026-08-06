import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * 投票資料存取層
 */
@Injectable()
export class VoteRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 查詢活動的投票相關資訊
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
   * 查詢使用者在活動中的 hasVoted 狀態
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
   * 查詢使用者目前已提交（committed）的 available slot IDs
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
   * 查詢使用者目前的 staged 草稿
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
   * 讓同一位使用者的 staged 草稿讀取→套用 delta→寫回成為單一臨界區。
   *
   * 這段是 read-modify-write，而且 upsert 是整份 slotIds 覆蓋：兩個同時飛的
   * PATCH 會讀到同一份舊資料，後寫的那個把先寫的格子整個蓋掉。advisory lock
   * 綁在 transaction 上，交易結束（含 rollback）時由 Postgres 自動釋放。
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
   * upsert staged 草稿
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
   * 刪除 staged 草稿
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
   * 刪除使用者在活動中的所有投票
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
   * 批次建立投票紀錄
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
   * 更新預期參與者的投票狀態
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
   * 使用交易執行完整的投票流程
   */
  async submitVoteInTransaction(
    eventId: string,
    userId: string,
    availableSlotIds: string[],
  ) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 1. 刪除該 user 在此 event 的舊投票
        await this.deleteUserVotes(eventId, userId, prisma);

        // 2. 建立新的投票紀錄（記錄有空的時段）
        if (availableSlotIds.length > 0) {
          await this.createVotes(eventId, userId, availableSlotIds, prisma);
        }

        // 3. 更新 EventExpectedParticipant 的 hasVoted 狀態
        await this.updateParticipantVoteStatus(eventId, userId, true, prisma);

        return { availableSlotIds };
      },
    );
  }

  /**
   * 增量新增投票
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
   * 刪除指定 slots 的投票
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
   * 使用交易執行增量投票更新
   */
  async updateVotesInTransaction(
    eventId: string,
    userId: string,
    addSlotIds: string[],
    removeSlotIds: string[],
  ) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 1. 新增投票
        if (addSlotIds.length > 0) {
          await this.upsertVotes(eventId, userId, addSlotIds, prisma);
        }

        // 2. 刪除投票
        if (removeSlotIds.length > 0) {
          await this.deleteSpecificVotes(
            eventId,
            userId,
            removeSlotIds,
            prisma,
          );
        }

        // 3. 更新 EventExpectedParticipant 的 hasVoted 狀態
        await this.updateParticipantVoteStatus(eventId, userId, true, prisma);

        return { addSlotIds, removeSlotIds };
      },
    );
  }

  /**
   * 將 staged 草稿提交為 committed votes 並清除草稿
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
