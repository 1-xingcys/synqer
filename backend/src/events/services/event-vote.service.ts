import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { VoteEventDto, VoteMode } from '../dto/vote-event.dto';

/**
 * 活動投票服務
 */
@Injectable()
export class EventVoteService {
  constructor(private prisma: PrismaService) {}

  /**
   * 儲存使用者的投票
   * 支援兩種模式：
   * 1. available: 投自己「可以」的時間，未選擇的時段視為不行
   * 2. unavailable: 投自己「不行」的時間，未選擇的時段視為可以
   */
  async vote(eventId: string, userId: string, voteDto: VoteEventDto) {
    const { selectedSlotIds, voteMode = VoteMode.AVAILABLE } = voteDto;

    // 使用 transaction 保證一致性
    const result = await this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 0. 檢查活動是否存在、是否已刪除、投票是否已截止
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: {
            votingDeadline: true,
            lineGroupId: true,
            isDeleted: true,
          },
        });

        if (!event || event.isDeleted) {
          throw new BadRequestException('活動不存在');
        }

        if (event.votingDeadline && new Date() > event.votingDeadline) {
          throw new BadRequestException('投票已截止');
        }

        // 1. 刪除該 user 在此 event 的舊投票
        await prisma.eventVote.deleteMany({
          where: {
            eventId,
            userId,
          },
        });

        // 2. 取得該活動的所有 slot IDs
        const allSlots = await prisma.eventTimeSlot.findMany({
          where: { eventId },
          select: { id: true },
        });
        const allSlotIds = allSlots.map((s) => s.id);

        // 3. 根據投票模式計算「有空」的時段
        let availableSlotIds: string[];

        if (voteMode === VoteMode.UNAVAILABLE) {
          // 如果是投「不行」的時間，把其他時間都視為可以
          const unavailableSet = new Set(selectedSlotIds);
          availableSlotIds = allSlotIds.filter((id) => !unavailableSet.has(id));
        } else {
          // 如果是投「可以」的時間，直接使用選擇的時段
          availableSlotIds = selectedSlotIds;
        }

        // 4. 建立新的投票紀錄（記錄有空的時段）
        if (availableSlotIds.length > 0) {
          await prisma.eventVote.createMany({
            data: availableSlotIds.map((slotId) => ({
              eventId,
              slotId,
              userId,
            })),
          });
        }

        // 5. 更新 EventExpectedParticipant 的 hasVoted 狀態
        await prisma.eventExpectedParticipant.updateMany({
          where: {
            eventId,
            userId,
          },
          data: {
            hasVoted: true,
          },
        });

        return { availableSlotIds };
      },
    );

    return {
      success: true,
      votedSlots: result.availableSlotIds.length,
      voteMode,
    };
  }
}
