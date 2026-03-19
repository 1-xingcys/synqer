import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 時間槽資料存取（跨模組共用）
 */
@Injectable()
export class TimeSlotRepository {
  constructor(private prisma: PrismaService) {}

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
}
