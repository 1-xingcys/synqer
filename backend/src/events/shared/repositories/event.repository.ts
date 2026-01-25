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
   * 根據 ID 查詢活動基本資訊
   */
  async findById(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  /**
   * 根據 ID 查詢活動（僅取特定欄位）
   */
  async findByIdSelect<T>(
    eventId: string,
    select: Record<string, boolean>,
  ): Promise<T | null> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      select,
    }) as Promise<T | null>;
  }

  /**
   * 檢查活動是否存在且未被刪除
   */
  async exists(eventId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isDeleted: true },
    });
    return !!event && !event.isDeleted;
  }

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
