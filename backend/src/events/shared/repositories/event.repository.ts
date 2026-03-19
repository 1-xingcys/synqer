import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 活動基礎資料存取（共用 Repository）
 * 提供基本的活動查詢，供權限驗證等共用服務使用
 */
@Injectable()
export class EventBaseRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * 查詢活動擁有者資訊
   */
  async findOwnerInfo(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, ownerId: true, isDeleted: true },
    });
  }
}
