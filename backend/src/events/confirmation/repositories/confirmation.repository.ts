import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * 確認時段資料存取層
 */
@Injectable()
export class ConfirmationRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 驗證時間槽是否屬於指定活動
   */
  async findSlotsByIdsAndEventId(eventId: string, slotIds: string[]) {
    return this.prisma.eventTimeSlot.findMany({
      where: {
        id: { in: slotIds },
        eventId,
      },
    });
  }

  /**
   * 刪除活動的所有確認時段
   */
  async deleteAllConfirmedSlots(
    eventId: string,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.confirmedEventTimeSlot.deleteMany({
      where: { eventId },
    });
  }

  /**
   * 批次建立確認時段
   */
  async createConfirmedSlots(
    eventId: string,
    slotIds: string[],
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.confirmedEventTimeSlot.createMany({
      data: slotIds.map((slotId) => ({
        eventId,
        slotId,
      })),
    });
  }

  /**
   * 使用交易更新確認時段
   */
  async updateConfirmedSlotsInTransaction(eventId: string, slotIds: string[]) {
    return this.prisma.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 刪除現有的確認時段
        await this.deleteAllConfirmedSlots(eventId, prisma);

        // 新增新的確認時段
        await this.createConfirmedSlots(eventId, slotIds, prisma);
      },
    );
  }

  /**
   * 查詢活動及其確認時段
   */
  async findEventWithConfirmedSlots(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        confirmedTimeSlots: {
          include: {
            slot: {
              select: {
                id: true,
                date: true,
                startMinute: true,
                endMinute: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 查詢活動基本資訊
   */
  async findEventBasicInfo(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    });
  }
}
