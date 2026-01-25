import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * 時間槽資料存取（跨模組共用）
 */
@Injectable()
export class TimeSlotRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 批次建立時間槽
   */
  async createMany(
    eventId: string,
    slots: Array<{ date: Date; startMinute: number; endMinute: number }>,
    prismaClient?: Prisma.TransactionClient,
  ) {
    const client = prismaClient || this.prisma;
    return client.eventTimeSlot.createMany({
      data: slots.map((slot, index) => ({
        eventId,
        date: slot.date,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        index,
      })),
    });
  }

  /**
   * 查詢活動的所有時間槽
   */
  async findByEventId(eventId: string) {
    return this.prisma.eventTimeSlot.findMany({
      where: { eventId },
      orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
    });
  }

  /**
   * 查詢活動的所有時間槽 ID
   */
  async findIdsByEventId(eventId: string): Promise<string[]> {
    const slots = await this.prisma.eventTimeSlot.findMany({
      where: { eventId },
      select: { id: true },
    });
    return slots.map((s) => s.id);
  }

  /**
   * 根據 ID 列表查詢時間槽
   */
  async findByIds(slotIds: string[]) {
    return this.prisma.eventTimeSlot.findMany({
      where: { id: { in: slotIds } },
    });
  }

  /**
   * 驗證時間槽是否屬於指定活動
   */
  async validateSlotsForEvent(
    eventId: string,
    slotIds: string[],
  ): Promise<boolean> {
    // 去重後再驗證
    const uniqueSlotIds = [...new Set(slotIds)];
    const slots = await this.prisma.eventTimeSlot.findMany({
      where: {
        id: { in: uniqueSlotIds },
        eventId,
      },
      select: { id: true },
    });
    return slots.length === uniqueSlotIds.length;
  }
}
