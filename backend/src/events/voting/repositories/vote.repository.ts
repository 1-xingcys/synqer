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
}
